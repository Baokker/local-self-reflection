import { describe, expect, it } from 'vitest';
import {
  ensureProfileHistory,
  loadLatestProfile,
  loadProfileHistory,
  saveGeneratedProfile
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
      write: async (value: string) => {
        this.content = value;
      },
      close: async () => undefined
    };
  }

  async getFile() {
    return {
      text: async () => this.content
    };
  }
}

describe('profile persistence', () => {
  it('saves generated profile and metadata into profiles', async () => {
    const root = new MemoryDirectoryHandle('root');

    await saveGeneratedProfile(root, {
      profile: '这是一段阶段性自我画像',
      metadata: {
        sources: ['note.md', 'onboarding:q1'],
        generatedAt: '2026-06-17T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });

    const latest = await loadLatestProfile(root);
    expect(latest?.profile).toContain('阶段性自我画像');
    expect(latest?.metadata.sources).toEqual(['note.md', 'onboarding:q1']);
  });

  it('keeps every generated profile as a separate immutable version', async () => {
    const root = new MemoryDirectoryHandle('root');

    await saveGeneratedProfile(root, {
      profile: '第一份画像',
      metadata: {
        sources: ['first.md'],
        generatedAt: '2026-06-17T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });
    await saveGeneratedProfile(root, {
      profile: '第二份画像',
      metadata: {
        sources: ['second.md'],
        generatedAt: '2026-07-13T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });

    const history = await loadProfileHistory(root);
    expect(history.versions.map((version) => version.profile)).toEqual(['第二份画像', '第一份画像']);
    expect(history.currentProfileId).toBe(history.versions[0]?.id);
    expect((await loadLatestProfile(root))?.profile).toBe('第二份画像');
  });

  it('migrates the legacy current profile without changing or deleting it', async () => {
    const root = new MemoryDirectoryHandle('root');
    const workspace = await root.getDirectoryHandle('ai-self-analysis', { create: true });
    const profiles = await workspace.getDirectoryHandle('profiles', { create: true });
    const legacyFile = await profiles.getFileHandle('current-self-profile.json', { create: true });
    const legacyContent = JSON.stringify({
      profile: '原来的画像',
      metadata: {
        sources: ['old-note.md'],
        generatedAt: '2026-05-01T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });
    const writable = await legacyFile.createWritable();
    await writable.write(legacyContent);
    await writable.close();

    const history = await ensureProfileHistory(root);

    expect(history.versions).toHaveLength(1);
    expect(history.versions[0]?.profile).toBe('原来的画像');
    await expect((await legacyFile.getFile()).text()).resolves.toBe(legacyContent);
  });
});
