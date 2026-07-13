import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
  MODEL_CONFIG_STORAGE_KEY,
  loadStoredModelConfig,
  saveModelConfig,
  testModelConnection,
  type ModelConfig
} from './model';

describe('model configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to DeepSeek V4 Pro', () => {
    const config = loadStoredModelConfig();
    expect(config.baseUrl).toBe(DEFAULT_DEEPSEEK_BASE_URL);
    expect(config.model).toBe(DEFAULT_DEEPSEEK_MODEL);
  });

  it('saves model config to localStorage', () => {
    const config: ModelConfig = {
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      model: 'deepseek-v4-pro'
    };

    saveModelConfig(config);

    expect(localStorage.getItem(MODEL_CONFIG_STORAGE_KEY)).toContain('deepseek-v4-pro');
    expect(loadStoredModelConfig()).toEqual(config);
  });

  it('tests OpenAI-compatible connection successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'pong' } }]
        })
      })
    );

    const result = await testModelConnection({
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      model: 'deepseek-v4-pro'
    });

    expect(result.status).toBe('success');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test'
        })
      })
    );
  });

  it('maps provider errors to helpful Chinese messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'invalid key'
          }
        })
      })
    );

    const result = await testModelConnection({
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-bad',
      model: 'deepseek-v4-pro'
    });

    expect(result.status).toBe('error');
    expect(result.message).toMatch(/API Key/);
    expect(result.guidance).toEqual(expect.arrayContaining([expect.stringMatching(/Base URL/)]));
  });

  it('does not allow continuing when the model test fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            message: 'model not found'
          }
        })
      })
    );

    const result = await testModelConnection({
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-bad',
      model: 'wrong-model'
    });

    expect(result.status).toBe('error');
    expect(result.message).toMatch(/模型名|Base URL/);
  });
});
