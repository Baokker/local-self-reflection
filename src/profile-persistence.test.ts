import { describe, expect, it } from 'vitest';
import {
  loadLatestProfile,
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
});
