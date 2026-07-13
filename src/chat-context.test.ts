import { describe, expect, it } from 'vitest';
import { buildChatPrompts, filterMaterialIndex, resolveChatContext } from './chat-context';
import { emptyMaterialIndex, indexMaterial } from './retrieval';

describe('per-chat context', () => {
  it('uses deterministic defaults for a legacy chat', () => {
    expect(resolveChatContext(undefined, 'profile-current', ['a.md', 'b.md'])).toEqual({
      profileId: 'profile-current',
      materialStoredNames: ['a.md', 'b.md'],
      recentMessageLimit: 6
    });
  });

  it('restricts retrieval to selected materials', () => {
    const index = emptyMaterialIndex();
    index.chunks = [
      ...indexMaterial({ sourceName: '工作.md', storedName: 'work.md', text: '工作让我很累。' }),
      ...indexMaterial({ sourceName: '生活.md', storedName: 'life.md', text: '散步让我放松。' })
    ];
    expect(filterMaterialIndex(index, ['life.md']).chunks.map((chunk) => chunk.sourceName)).toEqual(['生活.md']);
  });

  it('bounds recent messages and uses the selected profile text', () => {
    const prompts = buildChatPrompts({
      profile: '这是旧版本画像',
      profileSupplement: '',
      retrievedChunks: [],
      messages: [
        { role: 'user', content: '第一条', createdAt: '1' },
        { role: 'assistant', content: '第二条', createdAt: '2' },
        { role: 'user', content: '第三条', createdAt: '3' }
      ],
      recentMessageLimit: 2,
      question: '现在怎么看？'
    }).join('\n');

    expect(prompts).toContain('这是旧版本画像');
    expect(prompts).not.toContain('第一条');
    expect(prompts).toContain('第二条');
    expect(prompts).toContain('第三条');
  });
});
