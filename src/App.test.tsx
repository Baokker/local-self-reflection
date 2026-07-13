import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

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
      write: async (value: string | Blob) => {
        this.content = typeof value === 'string' ? value : await value.text();
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

const guidedAnswers = [
  '我最近总是在想，怎样才能过一种更贴近自己的生活。',
  '反复处理没有意义的琐事最消耗我。',
  '安静写东西的时候，我会觉得很投入。',
  '我在稳定的安排和新的可能之间犹豫。',
  '我想先调整每天的时间分配。',
  '我希望一个月后能有更稳定的生活节奏。'
];

async function answerGuidedQuestions(
  user: ReturnType<typeof userEvent.setup>,
  startIndex = 0
) {
  for (let index = startIndex; index < guidedAnswers.length; index += 1) {
    const textarea = screen.getByPlaceholderText(/想到哪写到哪/);
    if (!textarea.getAttribute('value') && !(textarea as HTMLTextAreaElement).value) {
      await user.type(textarea, guidedAnswers[index]);
    }
    await user.click(screen.getByRole('button', {
      name: index === guidedAnswers.length - 1 ? /保存，生成画像/ : /保存，下一题/
    }));
  }
}

describe('first-run flow shell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.showDirectoryPicker = vi.fn().mockResolvedValue(new MemoryDirectoryHandle('我的资料夹'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url, options?: RequestInit) => {
        const body = JSON.parse(String(options?.body ?? '{}'));
        if (body.messages?.[0]?.content === 'Reply with pong.') {
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: 'pong' } }]
            })
          };
        }

        if (String(body.messages?.[0]?.content ?? '').includes('先整理下面这些材料里反复出现的事情')) {
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: '主题：想重新整理生活节奏、需要更稳定的内心空间' } }]
            })
          };
        }

        if (String(body.messages?.[0]?.content ?? '').includes('只问一个问题')) {
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: '如果把这件事说得更具体一点，最近最卡住你的那一刻是什么？'
                  }
                }
              ]
            })
          };
        }

        if (String(body.messages?.[0]?.content ?? '').includes('用户提问')) {
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: '从你现在这份画像来看，你更需要的不是更用力，而是更稳定的自我站位。'
                  }
                }
              ]
            })
          };
        }

        if (String(body.messages?.[0]?.content ?? '').includes('优势、短板、机会、风险')) {
          return {
            ok: true,
            json: async () => ({
              choices: [{ message: { content: '## 优势\n- 能持续整理自己的想法。\n\n## 短板\n- 容易被琐事耗尽精力。\n\n## 机会\n- 已经开始调整生活节奏。\n\n## 风险\n- 计划过多时容易失去重点。' } }]
            })
          };
        }

        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content:
                    '你最近像是在努力把生活重新整理出一点秩序。\n\n## 小结\n- 你需要更稳定的内心空间'
                }
              }
            ]
          })
        };
      })
    );
  });

  it('starts in Simplified Chinese with scope and privacy copy', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '见己' })).toBeInTheDocument();
    expect(screen.getByText(/不做心理诊断，也不能代替专业帮助/)).toBeInTheDocument();
    expect(screen.getByText(/选一个本地文件夹/)).toBeInTheDocument();
  });

  it('walks through the first-run route flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    expect(screen.getByRole('heading', { name: /这些内容存在哪里/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument());
    expect(screen.getByText(/本地文件夹：我的资料夹/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^测试连接$/ }));
    await waitFor(() => expect(screen.getByText(/连接成功/)).toBeInTheDocument());
    expect(screen.getByDisplayValue(/deepseek-v4-pro/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /连接好了，继续/ }));
    expect(screen.getByRole('heading', { name: /有旧材料/ })).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(['最近工作让我很疲惫，我想换一种生活节奏。'], '工作笔记.md', { type: 'text/markdown' }));
    await waitFor(() => expect(screen.getByText(/已经复制了 1 个文件/)).toBeInTheDocument());

    await user.type(screen.getByLabelText('标题'), '今天的补充');
    await user.type(screen.getByLabelText('内容'), '我发现安静写东西的时候，状态会好一些。');
    await user.click(screen.getByRole('button', { name: /保存到材料库/ }));
    await waitFor(() => expect(screen.getByText('今天的补充.md')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /开始六问复盘/ }));
    expect(screen.getByRole('heading', { name: /最近什么事/ })).toBeInTheDocument();

    await answerGuidedQuestions(user);
    await waitFor(() => expect(screen.getByText(/你最近像是在努力把生活重新整理出一点秩序/)).toBeInTheDocument());
    expect(screen.getByText('1 个版本')).toBeInTheDocument();
    expect(screen.getByLabelText(/哪里说偏了/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /保存补充，继续聊/ }));
    expect(screen.getByRole('heading', { name: /继续对话/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '清空' }));
    await user.click(screen.getByRole('checkbox', { name: '工作笔记.md' }));
    await user.selectOptions(screen.getByLabelText('最近对话条数'), '4');

    await user.type(screen.getByPlaceholderText(/稳定和自由/), '为什么工作让我疲惫？');
    await user.click(screen.getByRole('button', { name: /发送/ }));
    await waitFor(() => expect(screen.getByText('来源：工作笔记.md')).toBeInTheDocument());
    await user.click(screen.getByText('来源：工作笔记.md'));
    expect(screen.getByText(/最近工作让我很疲惫/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /个人 SWOT/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '个人 SWOT' })).toBeInTheDocument());
    expect(screen.getByText(/容易被琐事耗尽精力/)).toBeInTheDocument();
    expect(screen.getByText(/参考：当前画像/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '材料' }));
    expect(screen.getByRole('heading', { name: '材料库' })).toBeInTheDocument();
    expect(screen.getByText('工作笔记.md')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '报告' }));
    expect(screen.getByRole('heading', { name: '复盘报告' })).toBeInTheDocument();
  });

  it('offers a limited follow-up prompt and answers inside the chat workbench', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^测试连接$/ }));
    await waitFor(() => expect(screen.getByText(/连接成功/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /连接好了，继续/ }));
    await user.click(screen.getByRole('button', { name: /开始六问复盘/ }));

    await user.type(screen.getByPlaceholderText(/想到哪写到哪/), '我最近总是在想，怎样才能过一种更贴近自己的生活。');
    await user.click(screen.getByRole('button', { name: /帮我再问一句/ }));

    await waitFor(() =>
      expect(screen.getByText(/如果把这件事说得更具体一点，最近最卡住你的那一刻是什么/)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /这题已经追问过了/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /保存，下一题/ }));
    await answerGuidedQuestions(user, 1);
    await waitFor(() => expect(screen.getByRole('heading', { name: /这份画像只代表现在/ })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /保存补充，继续聊/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /继续对话/ })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /帮我找一个切入口/ }));
    await waitFor(() =>
      expect(screen.getByText(/从你现在这份画像来看，你更需要的不是更用力，而是更稳定的自我站位/)).toBeInTheDocument()
    );
  });

  it('keeps the continue button disabled after a failed model test', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'invalid key'
          }
        })
      })
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^测试连接$/ }));
    await waitFor(() => expect(screen.getByText(/API Key 无效/)).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /连接好了，继续/ })).toBeDisabled();
  });

  it('keeps all workbench areas reachable and shows honest empty states', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: '工作台导航' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: '聊天' }));
    expect(screen.getByRole('heading', { name: /这里还不能开始对话/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '报告' }));
    expect(screen.getByText(/先生成一份阶段画像/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument();
  });

  it('starts another reflection round and keeps both profile versions', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^测试连接$/ }));
    await waitFor(() => expect(screen.getByText(/连接成功/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /连接好了，继续/ }));
    await user.click(screen.getByRole('button', { name: /开始六问复盘/ }));
    await answerGuidedQuestions(user);
    await waitFor(() => expect(screen.getByText('1 个版本')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /保存补充，继续聊/ }));
    await user.click(screen.getByRole('button', { name: /开始新复盘/ }));
    expect(screen.getByText(/第 1 题，共 6 题/)).toBeInTheDocument();
    await answerGuidedQuestions(user);

    await waitFor(() => expect(screen.getByText('2 个版本')).toBeInTheDocument());
  });

  it('saves profile feedback and restores the conversation when the workspace is reopened', async () => {
    const user = userEvent.setup();
    const workspace = new MemoryDirectoryHandle('长期资料');
    window.showDirectoryPicker = vi.fn().mockResolvedValue(workspace);
    const first = render(<App />);

    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /连接 DeepSeek/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^测试连接$/ }));
    await waitFor(() => expect(screen.getByText(/连接成功/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /连接好了，继续/ }));
    await user.click(screen.getByRole('button', { name: /开始六问复盘/ }));
    await answerGuidedQuestions(user);
    await waitFor(() => expect(screen.getByRole('heading', { name: /这份画像只代表现在/ })).toBeInTheDocument());

    await user.type(screen.getByLabelText(/哪里说偏了/), '我不是想放弃，只是想换一种走法。');
    await user.click(screen.getByRole('button', { name: /保存补充，继续聊/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /继续对话/ })).toBeInTheDocument());
    expect(screen.getByText(/这次会参考/)).toBeInTheDocument();
    expect(screen.getByLabelText('聊天参考画像')).toBeInTheDocument();
    expect(screen.getByLabelText('最近对话条数')).toHaveValue('6');

    await user.type(screen.getByPlaceholderText(/稳定和自由/), '我为什么一直犹豫？');
    await user.click(screen.getByRole('button', { name: /发送/ }));
    await waitFor(() => expect(screen.getByText(/更稳定的自我站位/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '我为什么一直犹豫？' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('最近对话条数'), '4');

    await user.click(screen.getByRole('button', { name: /新建对话/ }));
    expect(screen.getByText(/可以直接问/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('最近对话条数'), '10');
    const titleInput = screen.getByLabelText('对话名称');
    await user.clear(titleInput);
    await user.type(titleInput, '关于下一步');
    await user.click(screen.getByRole('button', { name: /改名/ }));
    expect(screen.getByRole('button', { name: '关于下一步' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('搜索会话'), '下一步');
    expect(screen.queryByRole('button', { name: '我为什么一直犹豫？' })).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('搜索会话'));

    await user.click(screen.getByRole('button', { name: '我为什么一直犹豫？' }));
    expect(screen.getByLabelText('最近对话条数')).toHaveValue('4');
    await user.click(screen.getByRole('button', { name: '关于下一步' }));
    expect(screen.getByLabelText('最近对话条数')).toHaveValue('10');

    await user.click(screen.getByRole('button', { name: '归档会话' }));
    await user.click(screen.getByRole('button', { name: '已归档' }));
    expect(screen.getByRole('button', { name: '关于下一步' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关于下一步' }));
    await user.click(screen.getByRole('button', { name: '移回进行中' }));
    await user.click(screen.getByRole('button', { name: '进行中' }));

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: '关于下一步' }));
    await user.click(screen.getByRole('button', { name: '删除会话' }));
    expect(screen.queryByRole('button', { name: '关于下一步' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '我为什么一直犹豫？' }));
    await waitFor(() => expect(screen.getAllByText('我为什么一直犹豫？').length).toBeGreaterThan(0));

    first.unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /^开始$/ }));
    await user.click(screen.getByRole('button', { name: /^选择文件夹$/ }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /继续对话/ })).toBeInTheDocument());
    expect(screen.getAllByText('我为什么一直犹豫？').length).toBeGreaterThan(0);
    expect(screen.getByText(/更稳定的自我站位/)).toBeInTheDocument();
  });
});
