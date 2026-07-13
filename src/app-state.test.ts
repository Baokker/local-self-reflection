import { describe, expect, it } from 'vitest';
import {
  createInitialAppState,
  handleWorkspacePicked,
  type AppState,
  type PickerDirectoryHandle
} from './app-state';

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

describe('workspace picking state', () => {
  it('creates a new workspace and advances to model setup', async () => {
    const root = new MemoryDirectoryHandle('我的资料夹') as unknown as PickerDirectoryHandle;
    const state = createInitialAppState();

    const next = await handleWorkspacePicked(state, root);

    expect(next.step).toBe('model');
    expect(next.workspace.name).toBe('我的资料夹');
    expect(next.workspace.existingWorkspace).toBe(false);
  });

  it('detects an existing ai-self-analysis workspace', async () => {
    const root = new MemoryDirectoryHandle('已有资料');
    await root.getDirectoryHandle('ai-self-analysis', { create: true });

    const next = await handleWorkspacePicked(
      createInitialAppState(),
      root as unknown as PickerDirectoryHandle
    );

    expect(next.workspace.existingWorkspace).toBe(true);
    expect(next.workspace.statusMessage).toMatch(/原来的内容会保留/);
  });

  it('resumes onboarding when an unfinished session exists', async () => {
    const root = new MemoryDirectoryHandle('继续资料');
    const workspace = await root.getDirectoryHandle('ai-self-analysis', { create: true });
    const sessions = await workspace.getDirectoryHandle('sessions', { create: true });
    const sessionFile = await (sessions as unknown as {
      getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
        createWritable: () => Promise<{ write: (value: string) => Promise<void>; close: () => Promise<void> }>;
      }>;
    }).getFileHandle('onboarding-session.json', { create: true });
    const writable = await sessionFile.createWritable();
    await writable.write(
      JSON.stringify({
        currentStep: 2,
        completed: false,
        answers: [{ question: 'q1', answer: 'a1', stepIndex: 1 }]
      })
    );
    await writable.close();

    const next = await handleWorkspacePicked(
      createInitialAppState(),
      root as unknown as PickerDirectoryHandle
    );

    expect(next.step).toBe('onboarding');
    expect(next.workspace.statusMessage).toMatch(/接着写/);
  });

  it('keeps earlier state while attaching workspace details', async () => {
    const root = new MemoryDirectoryHandle('资料夹') as unknown as PickerDirectoryHandle;
    const state: AppState = {
      ...createInitialAppState(),
      modelConfig: {
        baseUrl: 'https://api.deepseek.com',
        apiKey: 'sk-test',
        model: 'deepseek-v4-pro'
      }
    };

    const next = await handleWorkspacePicked(state, root);

    expect(next.modelConfig.model).toBe('deepseek-v4-pro');
  });

  it('does not overwrite an existing saved profile when reopening a workspace', async () => {
    const root = new MemoryDirectoryHandle('已有资料');
    const workspace = await root.getDirectoryHandle('ai-self-analysis', { create: true });
    const profiles = await workspace.getDirectoryHandle('profiles', { create: true });
    const profileFile = await (profiles as unknown as {
      getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
        createWritable: () => Promise<{ write: (value: string) => Promise<void>; close: () => Promise<void> }>;
        getFile: () => Promise<{ text: () => Promise<string> }>;
      }>;
    }).getFileHandle('current-self-profile.json', { create: true });
    const writable = await profileFile.createWritable();
    await writable.write('{"profile":"保留原来的画像"}');
    await writable.close();

    await handleWorkspacePicked(createInitialAppState(), root as unknown as PickerDirectoryHandle);

    const preserved = await (await profileFile.getFile()).text();
    expect(preserved).toContain('保留原来的画像');
  });
});
