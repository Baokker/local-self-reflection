import { describe, expect, it } from 'vitest';
import { buildProfilePipeline, type AnalysisModel } from './analysis';

describe('bounded profile analysis pipeline', () => {
  it('runs bounded intermediate analysis before composing the profile', async () => {
    const calls: string[] = [];
    const model: AnalysisModel = {
      complete: async ({ step, prompt }) => {
        calls.push(step);
        if (step === 'themes') return '主题：疲惫、期待、需要更稳定的节奏';
        if (step === 'profile') return `你好像正在努力给自己找一个更稳的节奏。\n\n## 小结\n- 你很在意真实感`;
        return prompt;
      }
    };

    const result = await buildProfilePipeline({
      model,
      materials: [{ name: 'note.md', text: '最近总觉得很累，但也想重新开始。' }],
      answers: [{ question: '最近什么事情总在心里绕回来？', answer: '我想知道自己到底想要什么。' }]
    });

    expect(calls).toEqual(['themes', 'profile']);
    expect(result.profile).toContain('更稳的节奏');
    expect(result.metadata.sources).toEqual(['note.md', 'onboarding:最近什么事情总在心里绕回来？']);
  });

  it('limits material context before sending it into the model', async () => {
    let promptLength = 0;
    const model: AnalysisModel = {
      complete: async ({ step, prompt }) => {
        if (step === 'themes') promptLength = prompt.length;
        return step === 'themes' ? '主题：边界' : '一段温和画像';
      }
    };

    await buildProfilePipeline({
      model,
      maxMaterialChars: 80,
      materials: [{ name: 'long.txt', text: '很长'.repeat(200) }],
      answers: []
    });

    expect(promptLength).toBeLessThan(500);
  });
});
