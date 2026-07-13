import { describe, expect, it } from 'vitest';
import {
  activateChatSession,
  createChatSession,
  ensureChatWorkspace,
  renameChatSession,
  saveChatSession,
  saveReflectionSession,
  setChatArchived,
  softDeleteChatSession
} from './workspace';

class MemoryDirectoryHandle {
  readonly kind = 'directory';
  entries = new Map<string, MemoryDirectoryHandle | MemoryFileHandle>();

  constructor(readonly name: string) {}

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entries.get(name);
    if (existing instanceof MemoryDirectoryHandle) return existing;
    if (existing) throw new Error('is file');
    if (!options?.create) throw new Error('not found');
    const next = new MemoryDirectoryHandle(name);
    this.entries.set(name, next);
    return next;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entries.get(name);
    if (existing instanceof MemoryFileHandle) return existing;
    if (existing) throw new Error('is directory');
    if (!options?.create) throw new Error('not found');
    const next = new MemoryFileHandle(name);
    this.entries.set(name, next);
    return next;
  }
}

class MemoryFileHandle {
  content = '';
  constructor(readonly name: string) {}

  async createWritable() {
    return {
      write: async (value: string) => { this.content = value; },
      close: async () => undefined
    };
  }

  async getFile() {
    return { text: async () => this.content };
  }
}

describe('multiple local chat sessions', () => {
  it('creates, renames, switches, and restores independent conversations', async () => {
    const root = new MemoryDirectoryHandle('root');
    const first = await createChatSession(root, {
      title: '关于工作',
      context: {
        profileId: 'profile-old',
        materialStoredNames: ['work.md'],
        recentMessageLimit: 4
      }
    });
    const firstSaved = await saveChatSession(root, {
      ...first.activeSession!,
      messages: [{ role: 'user', content: '我对工作有些犹豫。', createdAt: '2026-07-13T01:00:00.000Z' }]
    });
    const second = await createChatSession(root, { title: '关于生活' });

    expect(second.manifest.chats).toHaveLength(2);
    expect(second.activeSession?.messages).toEqual([]);

    const renamed = await renameChatSession(root, second.activeSession!.id, '生活节奏');
    expect(renamed.activeSession?.title).toBe('生活节奏');

    const switched = await activateChatSession(root, firstSaved.activeSession!.id);
    expect(switched.activeSession?.messages[0]?.content).toMatch(/工作/);

    const restored = await ensureChatWorkspace(root);
    expect(restored.activeSession?.id).toBe(firstSaved.activeSession!.id);
    expect(restored.activeSession?.context).toEqual({
      profileId: 'profile-old',
      materialStoredNames: ['work.md'],
      recentMessageLimit: 4
    });
  });

  it('migrates the legacy session without changing the old file', async () => {
    const root = new MemoryDirectoryHandle('root');
    await saveReflectionSession(root, {
      profileSupplement: '这是旧补充。',
      messages: [{ role: 'user', content: '这是旧对话。', createdAt: '2026-07-13T01:00:00.000Z' }]
    });
    const workspace = root.entries.get('ai-self-analysis') as MemoryDirectoryHandle;
    const sessions = workspace.entries.get('sessions') as MemoryDirectoryHandle;
    const legacyFile = sessions.entries.get('reflection-session.json') as MemoryFileHandle;
    const original = legacyFile.content;

    const migrated = await ensureChatWorkspace(root);

    expect(migrated.activeSession?.messages[0]?.content).toBe('这是旧对话。');
    expect(legacyFile.content).toBe(original);
  });

  it('archives and soft-deletes chats without deleting their session files', async () => {
    const root = new MemoryDirectoryHandle('root');
    const created = await createChatSession(root, { title: '需要保留的对话' });
    const session = created.activeSession!;
    const workspace = root.entries.get('ai-self-analysis') as MemoryDirectoryHandle;
    const sessions = workspace.entries.get('sessions') as MemoryDirectoryHandle;
    const chats = sessions.entries.get('chats') as MemoryDirectoryHandle;
    const sessionFile = chats.entries.get(`${session.id}.json`) as MemoryFileHandle;
    const original = sessionFile.content;

    const archived = await setChatArchived(root, session.id, true);
    expect(archived.manifest.chats.find((item) => item.id === session.id)?.archivedAt).toBeTruthy();
    expect(sessionFile.content).toBe(original);

    const restored = await setChatArchived(root, session.id, false);
    expect(restored.activeSession?.id).toBe(session.id);

    const deleted = await softDeleteChatSession(root, session.id);
    expect(deleted.manifest.chats.find((item) => item.id === session.id)?.deletedAt).toBeTruthy();
    expect(deleted.activeSession).toBeNull();
    expect(sessionFile.content).toBe(original);
  });
});
