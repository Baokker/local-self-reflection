import { describe, expect, it } from 'vitest';
import { loadReflectionReports, saveReflectionReport } from './workspace';

class MemoryDirectoryHandle {
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

describe('report persistence', () => {
  it('saves timestamped reports without overwriting an earlier report', async () => {
    const root = new MemoryDirectoryHandle('root');
    const createdAt = '2026-07-13T08:00:00.000Z';
    const first = await saveReflectionReport(root, {
      type: 'stage-review',
      title: '阶段复盘',
      content: '第一份复盘',
      createdAt,
      sources: ['当前画像']
    });
    const second = await saveReflectionReport(root, {
      type: 'stage-review',
      title: '阶段复盘',
      content: '第二份复盘',
      createdAt,
      sources: ['当前画像']
    });

    const reports = await loadReflectionReports(root);
    expect(reports).toHaveLength(2);
    expect(first.id).not.toBe(second.id);
    expect(reports.map((report) => report.content)).toEqual(expect.arrayContaining(['第一份复盘', '第二份复盘']));
  });
});
