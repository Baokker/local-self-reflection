export const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-pro';
export const DEEPSEEK_FAST_MODEL = 'deepseek-v4-flash';
export const MODEL_CONFIG_STORAGE_KEY = 'ai-self-analysis:model-config';

export type ModelConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ModelConnectionResult =
  | { status: 'success'; message: string; guidance: string[] }
  | { status: 'error'; message: string; guidance: string[] };

export function loadStoredModelConfig(): ModelConfig {
  const raw = localStorage.getItem(MODEL_CONFIG_STORAGE_KEY);
  if (!raw) {
    return {
      baseUrl: DEFAULT_DEEPSEEK_BASE_URL,
      apiKey: '',
      model: DEFAULT_DEEPSEEK_MODEL
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ModelConfig>;
    return {
      baseUrl: parsed.baseUrl || DEFAULT_DEEPSEEK_BASE_URL,
      apiKey: parsed.apiKey || '',
      model: parsed.model || DEFAULT_DEEPSEEK_MODEL
    };
  } catch {
    return {
      baseUrl: DEFAULT_DEEPSEEK_BASE_URL,
      apiKey: '',
      model: DEFAULT_DEEPSEEK_MODEL
    };
  }
}

export function saveModelConfig(config: ModelConfig) {
  localStorage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export async function testModelConnection(config: ModelConfig): Promise<ModelConnectionResult> {
  try {
    const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Reply with pong.' }],
        max_tokens: 8,
        temperature: 0
      })
    });

    if (!response.ok) {
      const payload = await safeJson(response);
      return {
        status: 'error',
        message: mapProviderError(response.status, payload),
        guidance: deepseekGuidance()
      };
    }

    return {
      status: 'success',
      message: '连接成功，可以继续了。',
      guidance: [
        `当前推荐：${DEFAULT_DEEPSEEK_MODEL}`,
        `更快、更省的选择：${DEEPSEEK_FAST_MODEL}`
      ]
    };
  } catch {
    return {
      status: 'error',
      message: '没有连上。可能是网络问题，也可能是 Base URL 填错了。',
      guidance: deepseekGuidance()
    };
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

async function safeJson(response: Response) {
  try {
    return (await response.json()) as {
      error?: {
        message?: string;
      };
    };
  } catch {
    return {};
  }
}

function mapProviderError(status: number, payload: { error?: { message?: string } }) {
  const message = payload.error?.message || '';
  if (status === 401) return 'API Key 无效。请回到 DeepSeek 控制台确认后再试。';
  if (status === 404) return '没有找到这个模型或接口。请检查 Base URL 和模型名。';
  if (status === 429) return '请求太频繁，或者账户余额不足。请检查 DeepSeek 账户。';
  if (status >= 500) return '模型服务暂时出了问题，过一会儿再试。';
  if (message) return `模型返回了错误：${message}`;
  return '没有连上。请检查 Base URL、API Key 和模型名。';
}

function deepseekGuidance() {
  return [
    `DeepSeek Base URL：${DEFAULT_DEEPSEEK_BASE_URL}`,
    `推荐模型：${DEFAULT_DEEPSEEK_MODEL}`,
    `更快、更省：${DEEPSEEK_FAST_MODEL}`
  ];
}
