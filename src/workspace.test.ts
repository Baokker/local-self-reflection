import { describe, expect, it } from 'vitest';
import {
  createWorkspaceStructure,
  importMaterialFile,
  loadLatestProfile,
  loadOnboardingSession,
  loadReflectionSession,
  loadWorkspaceMetadata,
  saveGeneratedProfile,
  saveOnboardingAnswer,
  saveReflectionSession,
  startNewOnboardingSession,
  safeWorkspacePath,
  WORKSPACE_DIR
} from './workspace';

class MemoryDirectoryHandle {
  readonly kind = 'directory';
  entries = new Map<string, MemoryDirectoryHandle | MemoryFileHandle>();

  constructor(readonly name: string) {}

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entries.get(name);
    if (existing instanceof MemoryDirectoryHandle) return existing;
    if (existing) throw new Error(`${name} is a file`);
    if (!options?.create) throw new Error(`${name} not found`);
    const next = new MemoryDirectoryHandle(name);
    this.entries.set(name, next);
    return next;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const existing = this.entries.get(name);
    if (existing instanceof MemoryFileHandle) return existing;
    if (existing) throw new Error(`${name} is a directory`);
    if (!options?.create) throw new Error(`${name} not found`);
    const next = new MemoryFileHandle(name);
    this.entries.set(name, next);
    return next;
  }
}

class MemoryFileHandle {
  readonly kind = 'file';
  content = '';

  constructor(readonly name: string) {}

  async getFile() {
    return {
      text: async () => this.content
    };
  }

  async createWritable() {
    return {
      write: async (value: string | Blob) => {
        if (typeof value === 'string') {
          this.content = value;
          return;
        }
        if ('arrayBuffer' in value) {
          this.content = new TextDecoder().decode(await value.arrayBuffer());
          return;
        }
        this.content = String(value);
      },
      close: async () => undefined
    };
  }
}

describe('workspace safety', () => {
  it('creates product-owned directories inside ai-self-analysis only', async () => {
    const root = new MemoryDirectoryHandle('root');
    await root.getFileHandle('用户原来的文件.md', { create: true });

    await createWorkspaceStructure(root);

    expect(root.entries.has(WORKSPACE_DIR)).toBe(true);
    expect(root.entries.has('用户原来的文件.md')).toBe(true);
    const workspace = root.entries.get(WORKSPACE_DIR) as MemoryDirectoryHandle;
    expect([...workspace.entries.keys()]).toEqual([
      'materials',
      'sessions',
      'profiles',
      'reports',
      'index'
    ]);
  });

  it('rejects writes outside ai-self-analysis', () => {
    expect(() => safeWorkspacePath(['profiles', 'current-self-profile.md'])).not.toThrow();
    expect(() => safeWorkspacePath(['..', 'profiles', 'current-self-profile.md'])).toThrow(
      /outside/
    );
    expect(() => safeWorkspacePath(['materials/../secret.txt'])).toThrow(/outside/);
  });

  it('copies supported imports into materials and leaves source file unchanged', async () => {
    const root = new MemoryDirectoryHandle('root');
    const source = {
      name: 'note.md',
      text: async () => '原始内容'
    } as File;

    const result = await importMaterialFile(root, source);

    const workspace = root.entries.get(WORKSPACE_DIR) as MemoryDirectoryHandle;
    const materials = workspace.entries.get('materials') as MemoryDirectoryHandle;
    const copied = materials.entries.get(result.storedName) as MemoryFileHandle;
    expect(copied.content).toBe('原始内容');
    expect(await source.text()).toBe('原始内容');

    const metadata = await loadWorkspaceMetadata(root);
    expect(metadata.materials[0]?.originalName).toBe('note.md');
    expect(metadata.materials[0]?.storedName).toBe(result.storedName);
  });

  it('rejects unsupported import types', async () => {
    const root = new MemoryDirectoryHandle('root');

    await expect(importMaterialFile(root, new File(['x'], 'photo.png'))).rejects.toThrow(
      /supports/
    );
  });

  it('saves onboarding answers into the local workspace session file', async () => {
    const root = new MemoryDirectoryHandle('root');

    await saveOnboardingAnswer(root, {
      questionId: 'recurring-thought',
      question: '最近有什么事情总是在心里绕回来？',
      answer: '我总是在想自己到底更想过什么样的生活。',
      stepIndex: 1,
      followUpPrompt: '最近哪一个具体时刻，让你最明显地感觉到这件事？',
      completed: false
    });

    const session = await loadOnboardingSession(root);
    expect(session?.answers).toHaveLength(1);
    expect(session?.answers[0]?.answer).toMatch(/更想过什么样的生活/);
    expect(session?.currentStep).toBe(1);
    expect(session?.completed).toBe(false);
    expect(session?.answers[0]?.questionId).toBe('recurring-thought');
    expect(session?.answers[0]?.followUpPrompt).toMatch(/具体时刻/);
  });

  it('starts a new onboarding round without changing saved profiles', async () => {
    const root = new MemoryDirectoryHandle('root');
    await saveGeneratedProfile(root, {
      profile: '保留这份画像',
      metadata: {
        sources: ['onboarding:q1'],
        generatedAt: '2026-07-13T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });

    const session = await startNewOnboardingSession(root);

    expect(session.answers).toEqual([]);
    expect(session.completed).toBe(false);
    expect((await loadLatestProfile(root))?.profile).toBe('保留这份画像');
  });

  it('keeps pre-existing user files outside ai-self-analysis unchanged', async () => {
    const root = new MemoryDirectoryHandle('root');
    const existingUserFile = await root.getFileHandle('用户原来的总结.txt', { create: true });
    const writable = await existingUserFile.createWritable();
    await writable.write('不要改动我');
    await writable.close();

    await createWorkspaceStructure(root);
    await saveGeneratedProfile(root, {
      profile: '新的阶段性画像',
      metadata: {
        sources: ['onboarding:q1'],
        generatedAt: '2026-06-17T00:00:00.000Z',
        pipeline: 'bounded-profile-v1'
      }
    });

    const unchanged = await (await existingUserFile.getFile()).text();
    expect(unchanged).toBe('不要改动我');
    expect(await loadLatestProfile(root)).not.toBeNull();
  });

  it('saves and loads profile feedback with chat messages inside sessions', async () => {
    const root = new MemoryDirectoryHandle('root');

    await saveReflectionSession(root, {
      profileSupplement: '我并不是想停下来，只是想换一种走法。',
      messages: [
        {
          role: 'user',
          content: '我为什么总在稳定和自由之间摇摆？',
          createdAt: '2026-07-13T02:00:00.000Z'
        },
        {
          role: 'assistant',
          content: '你在意的可能不是二选一，而是能不能保留选择的余地。',
          createdAt: '2026-07-13T02:00:01.000Z'
        }
      ]
    });

    const session = await loadReflectionSession(root);
    expect(session?.profileSupplement).toMatch(/换一种走法/);
    expect(session?.messages).toHaveLength(2);
    expect(session?.messages[1]?.role).toBe('assistant');
  });
});
