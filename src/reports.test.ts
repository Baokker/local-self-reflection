import { describe, expect, it } from 'vitest';
import { buildReportPrompt } from './reports';

describe('fixed reflection reports', () => {
  it('builds a stage-review prompt with evidence boundaries', () => {
    const prompt = buildReportPrompt({
      type: 'stage-review',
      profile: '我最近在重新安排生活节奏。',
      materialExcerpts: [{ sourceName: '日记.md', text: '工作结束后常常很累。' }]
    });

    expect(prompt).toContain('接下来一个月');
    expect(prompt).toContain('日记.md');
    expect(prompt).toContain('不做心理诊断');
  });

  it('requires four clearly separated SWOT sections', () => {
    const prompt = buildReportPrompt({ type: 'swot', profile: '我喜欢独立完成复杂任务。' });
    expect(prompt).toContain('优势、短板、机会、风险');
    expect(prompt).toContain('不要把短板或风险写成人格定论');
  });
});
