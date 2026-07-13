import { describe, expect, it } from 'vitest';
import { emptyMaterialIndex, indexMaterial, retrieveRelevantChunks } from './retrieval';

describe('local material retrieval', () => {
  it('splits long text into bounded searchable chunks', () => {
    const chunks = indexMaterial({
      sourceName: '日记.md',
      storedName: 'saved-note.md',
      text: `工作让我很疲惫。\n\n${'我想重新安排生活节奏。'.repeat(80)}`
    }, 120);

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.text.length <= 120)).toBe(true);
    expect(chunks.every((chunk) => chunk.sourceName === '日记.md')).toBe(true);
  });

  it('ranks matching excerpts and keeps the request context bounded', () => {
    const index = emptyMaterialIndex();
    index.chunks = [
      ...indexMaterial({ sourceName: '工作.md', storedName: 'work.md', text: '最近工作很疲惫，我总想换一种节奏。' }),
      ...indexMaterial({ sourceName: '旅行.md', storedName: 'travel.md', text: '去年去了海边，天气很好。' }),
      ...indexMaterial({ sourceName: '选择.md', storedName: 'choice.md', text: '我在稳定工作和自由时间之间犹豫。' })
    ];

    const result = retrieveRelevantChunks(index, '工作让我疲惫，我想换一种节奏，但又舍不得稳定。', {
      limit: 2,
      maxTotalChars: 40
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.sourceName).toBe('工作.md');
    expect(result.map((item) => item.sourceName)).toContain('选择.md');
    expect(result.reduce((total, item) => total + item.text.length, 0)).toBeLessThanOrEqual(40);
  });
});
