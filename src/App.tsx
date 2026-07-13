import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FolderOpen,
  HeartHandshake,
  KeyRound,
  LoaderCircle,
  MessageCircle,
  NotebookText,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { createInitialAppState, handleWorkspacePicked, type AppState, type Step } from './app-state';
import { buildProfilePipeline } from './analysis';
import {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
  DEEPSEEK_FAST_MODEL,
  saveModelConfig,
  testModelConnection,
  type ModelConnectionResult
} from './model';
import {
  importMaterialFile,
  loadLatestProfile,
  loadReflectionSession,
  loadWorkspaceMetadata,
  saveGeneratedProfile,
  saveOnboardingAnswer,
  saveReflectionSession,
  type ReflectionMessage,
  type ReflectionSession,
  type SavedProfile,
  type WorkspaceMetadata
} from './workspace';
import './styles.css';

const steps: Array<{ id: Step; label: string }> = [
  { id: 'welcome', label: '开始' },
  { id: 'workspace', label: '本地文件夹' },
  { id: 'model', label: '连接模型' },
  { id: 'import', label: '旧材料' },
  { id: 'onboarding', label: '写下近况' },
  { id: 'profile', label: '阶段画像' },
  { id: 'chat', label: '接着聊' }
];

const emptyReflectionSession: ReflectionSession = {
  profileSupplement: '',
  messages: []
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => createInitialAppState());
  const [modelStatus, setModelStatus] = useState<ModelConnectionResult | null>(null);
  const [testingModel, setTestingModel] = useState(false);
  const [workspaceMetadata, setWorkspaceMetadata] = useState<WorkspaceMetadata>({ materials: [] });
  const [onboardingAnswer, setOnboardingAnswer] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [generatedProfile, setGeneratedProfile] = useState<SavedProfile | null>(null);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [reflectionSession, setReflectionSession] = useState<ReflectionSession>(emptyReflectionSession);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeIndex = steps.findIndex((item) => item.id === appState.step);
  const modelReady = modelStatus?.status === 'success';

  const modelConfig = appState.modelConfig;

  async function pickWorkspace() {
    const picker = window.showDirectoryPicker;
    if (!picker) {
      setAppState((current) => ({
        ...current,
        workspace: {
          ...current.workspace,
          statusMessage: '这个浏览器不能直接选择本地文件夹。请换用桌面版 Chrome 或 Edge。'
        }
      }));
      return;
    }

    try {
      const handle = await picker();
      const next = await handleWorkspacePicked(appState, handle);
      const metadata = await loadWorkspaceMetadata(handle);
      const profile = await loadLatestProfile(handle);
      const savedReflection = await loadReflectionSession(handle);
      const resumedStep = next.step === 'onboarding'
        ? 'onboarding'
        : savedReflection?.messages.length
          ? 'chat'
          : profile
            ? 'profile'
            : next.step;
      setAppState({ ...next, step: resumedStep });
      setWorkspaceMetadata(metadata);
      setOnboardingAnswer(next.onboardingSession?.answers.at(-1)?.answer ?? '');
      setGeneratedProfile(profile);
      setReflectionSession(savedReflection ?? emptyReflectionSession);
    } catch {
      setAppState((current) => ({
        ...current,
        workspace: {
          ...current.workspace,
          statusMessage: '还没有选好文件夹。选好后才能继续。'
        }
      }));
    }
  }

  async function runModelTest() {
    setTestingModel(true);
    saveModelConfig(modelConfig);
    const result = await testModelConnection(modelConfig);
    setModelStatus(result);
    setTestingModel(false);
  }

  async function requestFollowUpPrompt() {
    if (!onboardingAnswer.trim()) return;
    if (!modelReady) {
      setFollowUpPrompt('最近哪一个具体时刻，让你最明显地感觉到这件事？');
      return;
    }

    setLoadingFollowUp(true);
    try {
      const reply = await requestModelText(appState.modelConfig, [
        '请读完用户的回答，只问一个问题，帮他把刚才的话说得更具体。',
        '只写一句。不要评价，不要安慰，不要连续追问，也不要做心理诊断。',
        `用户回答：${onboardingAnswer}`
      ]);
      setFollowUpPrompt(reply.trim());
    } catch {
      setFollowUpPrompt('最近哪一个具体时刻，让你最明显地感觉到这件事？');
    } finally {
      setLoadingFollowUp(false);
    }
  }

  async function triggerImport(files: FileList | null) {
    if (!files?.length || !appState.workspace.handle?.getFileHandle) return;
    const workspaceHandle = appState.workspace.handle as BrowserDirectoryHandle & {
      getFileHandle: NonNullable<BrowserDirectoryHandle['getFileHandle']>;
    };

    const importedNames: string[] = [];
    for (const file of Array.from(files)) {
      const imported = await importMaterialFile(workspaceHandle, file);
      importedNames.push(imported.originalName);
    }
    const metadata = await loadWorkspaceMetadata(workspaceHandle);
    setWorkspaceMetadata(metadata);
    setImportFeedback(`已经复制了 ${importedNames.length} 个文件：${importedNames.join('、')}`);
  }

  async function continueOnboarding() {
    if (appState.workspace.handle?.getFileHandle) {
      const workspaceHandle = appState.workspace.handle as BrowserDirectoryHandle & {
        getFileHandle: NonNullable<BrowserDirectoryHandle['getFileHandle']>;
      };
      await saveOnboardingAnswer(workspaceHandle, {
        question: '最近反复想到的是什么？',
        answer: onboardingAnswer,
        stepIndex: 1,
        completed: false
      });
      const materials = await Promise.all(
        workspaceMetadata.materials.map(async (material) => {
          const materialsDir = await workspaceHandle.getDirectoryHandle('ai-self-analysis');
          const materialsFolder = await materialsDir.getDirectoryHandle('materials');
          const fileHandle = await materialsFolder.getFileHandle?.(material.storedName, { create: false });
          const file = await fileHandle?.getFile?.();
          const text = (await file?.text?.()) ?? '';
          return {
            name: material.storedName,
            text
          };
        })
      );

      setGeneratingProfile(true);
      const profile = await buildProfilePipeline({
        model: {
          complete: async ({ prompt }) => requestModelText(appState.modelConfig, [prompt], 0.6, 800)
        },
        materials,
        answers: [
          {
            question: '最近反复想到的是什么？',
            answer: onboardingAnswer
          }
        ]
      });

      const savedProfile: SavedProfile = {
        profile: profile.profile,
        metadata: profile.metadata
      };
      await saveOnboardingAnswer(workspaceHandle, {
        question: '最近反复想到的是什么？',
        answer: onboardingAnswer,
        stepIndex: 1,
        completed: true
      });
      await saveGeneratedProfile(workspaceHandle, savedProfile);
      setGeneratedProfile(savedProfile);
      setFollowUpPrompt('');
      setReflectionSession(emptyReflectionSession);
      setGeneratingProfile(false);
      setAppState((current) => ({
        ...current,
        onboardingSession: {
          currentStep: 1,
          completed: true,
          answers: [
            {
              question: '最近反复想到的是什么？',
              answer: onboardingAnswer,
              stepIndex: 1
            }
          ]
        },
        step: 'profile'
      }));
      return;
    }

    setAppState((current) => ({ ...current, step: 'profile' }));
  }

  async function continueToChat() {
    const nextSession = {
      ...reflectionSession,
      profileSupplement: reflectionSession.profileSupplement.trim()
    };
    if (appState.workspace.handle?.getFileHandle) {
      await saveReflectionSession(appState.workspace.handle as BrowserDirectoryHandle & {
        getFileHandle: NonNullable<BrowserDirectoryHandle['getFileHandle']>;
      }, nextSession);
    }
    setReflectionSession(nextSession);
    setAppState((current) => ({ ...current, step: 'chat' }));
  }

  async function sendChatMessage(promptOverride?: string) {
    const question = (promptOverride ?? chatInput).trim();
    if (!question || !generatedProfile) return;

    const userMessage: ReflectionMessage = {
      role: 'user',
      content: question,
      createdAt: new Date().toISOString()
    };
    const messagesWithQuestion = [...reflectionSession.messages, userMessage];
    setSendingChat(true);
    let reply = '';
    try {
      reply = await requestModelText(appState.modelConfig, [
        '只根据下面给出的阶段画像、用户补充和最近对话回答问题。',
        '说具体一点，少用套话。可以指出不确定之处，但不要做心理诊断，也不要假装读过未提供的材料。',
        `阶段性自我画像：\n${generatedProfile.profile}`,
        reflectionSession.profileSupplement
          ? `用户对画像的补充：\n${reflectionSession.profileSupplement}`
          : '',
        `最近对话：\n${messagesWithQuestion.slice(-6).map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n')}`,
        `用户提问：${question}`
      ]);
    } catch {
      reply = '这次没有收到模型回复。你的问题已经保存在本地，可以稍后再试。';
    }

    const assistantMessage: ReflectionMessage = {
      role: 'assistant',
      content: reply.trim(),
      createdAt: new Date().toISOString()
    };
    const nextSession = {
      ...reflectionSession,
      messages: [...messagesWithQuestion, assistantMessage]
    };
    if (appState.workspace.handle?.getFileHandle) {
      await saveReflectionSession(appState.workspace.handle as BrowserDirectoryHandle & {
        getFileHandle: NonNullable<BrowserDirectoryHandle['getFileHandle']>;
      }, nextSession);
    }
    setReflectionSession(nextSession);
    setChatInput('');
    setSendingChat(false);
  }

  const workspacePicked = useMemo(() => Boolean(appState.workspace.handle), [appState.workspace.handle]);

  return (
    <main className="app-shell">
      <aside className="side-panel" aria-label="当前步骤">
        <div className="brand-mark">AI</div>
        <p className="eyebrow">资料留在本地</p>
        <h1>AI 自我复盘工作台</h1>
        <p className="side-copy">
          把旧笔记、最近的想法和每次对话放在同一个本地文件夹里。下次打开，还能从上次停下的地方继续。
        </p>
        <div className="safety-note">
          <ShieldCheck size={18} />
          <span>这里帮你整理自己，不做心理诊断，也不能代替专业帮助。</span>
        </div>
        <ol className="step-list">
          {steps.map((item, index) => (
            <li key={item.id} className={index <= activeIndex ? 'active' : ''}>
              <span>{index + 1}</span>
              {item.label}
            </li>
          ))}
        </ol>
      </aside>

      <section className="work-surface">
        {renderStep({
          appState,
          setAppState,
          modelStatus,
          modelReady,
          pickWorkspace,
          runModelTest,
          testingModel,
          workspacePicked,
          workspaceMetadata,
          onboardingAnswer,
          setOnboardingAnswer,
          followUpPrompt,
          loadingFollowUp,
          requestFollowUpPrompt,
          continueOnboarding,
          triggerImport,
          importFeedback,
          fileInputRef,
          generatedProfile,
          generatingProfile,
          reflectionSession,
          setReflectionSession,
          continueToChat,
          chatInput,
          setChatInput,
          sendingChat,
          sendChatMessage
        })}
      </section>
    </main>
  );
}

function renderStep({
  appState,
  setAppState,
  modelStatus,
  modelReady,
  pickWorkspace,
  runModelTest,
  testingModel,
  workspacePicked,
  workspaceMetadata,
  onboardingAnswer,
  setOnboardingAnswer,
  followUpPrompt,
  loadingFollowUp,
  requestFollowUpPrompt,
  continueOnboarding,
  triggerImport,
  importFeedback,
  fileInputRef,
  generatedProfile,
  generatingProfile,
  reflectionSession,
  setReflectionSession,
  continueToChat,
  chatInput,
  setChatInput,
  sendingChat,
  sendChatMessage
}: {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  modelStatus: ModelConnectionResult | null;
  modelReady: boolean;
  pickWorkspace: () => Promise<void>;
  runModelTest: () => Promise<void>;
  testingModel: boolean;
  workspacePicked: boolean;
  workspaceMetadata: WorkspaceMetadata;
  onboardingAnswer: string;
  setOnboardingAnswer: React.Dispatch<React.SetStateAction<string>>;
  followUpPrompt: string;
  loadingFollowUp: boolean;
  requestFollowUpPrompt: () => Promise<void>;
  continueOnboarding: () => Promise<void>;
  triggerImport: (files: FileList | null) => Promise<void>;
  importFeedback: string;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  generatedProfile: SavedProfile | null;
  generatingProfile: boolean;
  reflectionSession: ReflectionSession;
  setReflectionSession: React.Dispatch<React.SetStateAction<ReflectionSession>>;
  continueToChat: () => Promise<void>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  sendingChat: boolean;
  sendChatMessage: (promptOverride?: string) => Promise<void>;
}) {
  const step = appState.step;

  if (step === 'welcome') {
    return (
      <Panel
        icon={<HeartHandshake />}
        kicker="从这里开始"
        title="先把关于自己的材料放到一起"
        body="选一个本地文件夹。你可以导入旧笔记，也可以直接写下最近在想什么。写完后，AI 会根据这些内容整理一份阶段性画像。"
      >
        <button className="primary-action" onClick={() => setAppState((current) => ({ ...current, step: 'workspace' }))}>
          开始
        </button>
      </Panel>
    );
  }

  if (step === 'workspace') {
    return (
      <Panel
        icon={<FolderOpen />}
        kicker="先选保存位置"
        title="这些内容存在哪里？"
        body="选好文件夹后，应用会在里面新建一个可见的 ai-self-analysis/ 目录。除此之外的文件不会被删除、移动、改名或覆盖。"
      >
        <div className="info-grid">
          <Info title="应用会写入" text="ai-self-analysis/ 里的 materials、sessions、profiles、reports 和 index。" />
          <Info title="你的原文件" text="导入时只复制一份，原文件留在原处，不会改动。" />
        </div>
        <div className="actions-row">
          <button className="primary-action" onClick={pickWorkspace}>
            选择文件夹
          </button>
          <button
            className="secondary-action"
            onClick={() => setAppState((current) => ({ ...current, step: 'model' }))}
            disabled={!workspacePicked}
          >
            继续
          </button>
        </div>
        {appState.workspace.statusMessage ? (
          <p className={workspacePicked ? 'success-text' : 'hint-text'}>
            {workspacePicked ? <CheckCircle2 size={16} /> : null}
            {appState.workspace.statusMessage}
          </p>
        ) : null}
      </Panel>
    );
  }

  if (step === 'model') {
    return (
      <Panel
        icon={<KeyRound />}
        kicker="接上模型"
        title="连接 DeepSeek 或其他兼容模型"
        body="API Key 只留在这个浏览器里，不会写进你选的文件夹。模型测试成功后才能继续。"
      >
        {appState.workspace.name ? (
          <div className="workspace-badge">本地文件夹：{appState.workspace.name}</div>
        ) : null}
        <div className="form-stack">
          <label>
            Base URL
            <input
              placeholder={`例如：${DEFAULT_DEEPSEEK_BASE_URL}`}
              value={appState.modelConfig.baseUrl}
              onChange={(event) =>
                setAppState((current) => ({
                  ...current,
                  modelConfig: {
                    ...current.modelConfig,
                    baseUrl: event.target.value
                  }
                }))
              }
            />
          </label>
          <label>
            API Key
            <input
              type="password"
              placeholder="只保存在这个浏览器里"
              value={appState.modelConfig.apiKey}
              onChange={(event) =>
                setAppState((current) => ({
                  ...current,
                  modelConfig: {
                    ...current.modelConfig,
                    apiKey: event.target.value
                  }
                }))
              }
            />
          </label>
          <label>
            模型名
            <input
              placeholder={`推荐：${DEFAULT_DEEPSEEK_MODEL}`}
              value={appState.modelConfig.model}
              onChange={(event) =>
                setAppState((current) => ({
                  ...current,
                  modelConfig: {
                    ...current.modelConfig,
                    model: event.target.value
                  }
                }))
              }
            />
          </label>
        </div>
        <div className="actions-row">
          <button className="primary-action" onClick={runModelTest} disabled={testingModel}>
            {testingModel ? (
              <>
                <LoaderCircle size={16} className="spin" /> 正在连接
              </>
            ) : (
              '测试连接'
            )}
          </button>
          <button
            className="secondary-action"
            onClick={() => setAppState((current) => ({ ...current, step: 'import' }))}
            disabled={!modelReady}
          >
            连接好了，继续
          </button>
        </div>
        {modelStatus ? (
          <div className={modelStatus.status === 'success' ? 'status-box success' : 'status-box error'}>
            <p className={modelStatus.status === 'success' ? 'success-text' : 'error-text'}>
              {modelStatus.status === 'success' ? <CheckCircle2 size={16} /> : null}
              {modelStatus.message}
            </p>
            <ul>
              {modelStatus.guidance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="hint-text">
            使用 DeepSeek 时，Base URL 填 {DEFAULT_DEEPSEEK_BASE_URL}，模型可先用 {DEFAULT_DEEPSEEK_MODEL}。
            想省一点费用，可以换成 {DEEPSEEK_FAST_MODEL}。
          </p>
        )}
      </Panel>
    );
  }

  if (step === 'import') {
    return (
      <Panel
        icon={<Upload />}
        kicker="这一步可以跳过"
        title="有旧材料，就先放几份进来"
        body="备忘录、随笔、日记和导出的表格都可以。现在没有也没关系，直接写下近况就行。"
      >
        <div className="drop-zone">目前支持 .md、.txt、.csv 和 .json。文件会复制到 ai-self-analysis/materials/。</div>
        {workspaceMetadata.materials.length ? (
          <div className="workspace-badge">已经放进来 {workspaceMetadata.materials.length} 份材料</div>
        ) : null}
        {importFeedback ? <p className="success-text"><CheckCircle2 size={16} />{importFeedback}</p> : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.csv,.json"
          multiple
          hidden
          onChange={(event) => void triggerImport(event.target.files)}
        />
        <div className="actions-row">
          <button className="secondary-action" onClick={() => fileInputRef.current?.click()}>
            选择文件
          </button>
          <button className="primary-action" onClick={() => setAppState((current) => ({ ...current, step: 'onboarding' }))}>
            暂时没有，开始写
          </button>
        </div>
      </Panel>
    );
  }

  if (step === 'onboarding') {
    return (
      <Panel
        icon={<NotebookText />}
        kicker="先回答一个问题"
        title="最近什么事总在脑子里打转？"
        body="不用写完整，也不用急着解释清楚。想到哪写到哪，这段内容会先保存在本地。"
      >
        <label className="large-answer">
          最近反复想到的是什么？
          <textarea
            placeholder="想到哪写到哪。用语音输入也可以。"
            value={onboardingAnswer}
            onChange={(event) => setOnboardingAnswer(event.target.value)}
          />
        </label>
        {followUpPrompt ? <div className="follow-up-box">{followUpPrompt}</div> : null}
        <div className="actions-row">
          <button className="secondary-action" onClick={() => void requestFollowUpPrompt()} disabled={!onboardingAnswer.trim() || loadingFollowUp}>
            {loadingFollowUp ? '正在想一个追问' : '帮我再问一句'}
          </button>
          <button className="primary-action" onClick={() => void continueOnboarding()} disabled={!onboardingAnswer.trim()}>
            保存，生成画像
          </button>
        </div>
      </Panel>
    );
  }

  if (step === 'profile') {
    return (
      <Panel
        icon={<HeartHandshake />}
        kicker="先读一遍"
        title="这份画像只代表现在"
        body="它根据你刚才提供的内容写成。读完后，告诉它哪里说偏了，或者还漏了什么。"
      >
        {generatingProfile ? (
          <p className="success-text">
            <LoaderCircle size={16} className="spin" /> 正在整理你刚才写的内容……
          </p>
        ) : null}
        <article className="profile-preview">
          <p>{generatedProfile?.profile ?? '你似乎在重新判断，哪些事情是自己真正想要的，哪些只是沿着惯性在做。现在还不用急着得出结论，先把那些反复出现的想法留住。'}</p>
          <div className="summary-grid">
            <Info title="参考内容" text={generatedProfile ? `${generatedProfile.metadata.sources.length} 条来源` : '刚才写下的近况'} />
            <Info title="生成方式" text={generatedProfile ? '先整理线索，再写画像' : '分两步整理'} />
            <Info title="生成时间" text={generatedProfile ? new Date(generatedProfile.metadata.generatedAt).toLocaleString('zh-CN') : '刚刚'} />
          </div>
        </article>
        <label className="large-answer">
          哪里说偏了？还想补充什么？
          <textarea
            placeholder="比如：我不是想停下来，只是想换一种走法。"
            value={reflectionSession.profileSupplement}
            onChange={(event) => setReflectionSession((current) => ({
              ...current,
              profileSupplement: event.target.value
            }))}
          />
        </label>
        <button className="primary-action" onClick={() => void continueToChat()}>
          保存补充，继续聊
        </button>
      </Panel>
    );
  }

  return (
    <Panel
      icon={<MessageCircle />}
      kicker={reflectionSession.messages.length ? '上次的对话还在' : '从画像接着聊'}
      title="继续对话"
      body="这里会参考当前画像、你的补充和最近几轮对话。它不会自行翻遍整个文件夹。"
    >
      <div className="chat-workbench">
        <aside className="context-panel" aria-label="本次对话参考内容">
          <strong>这次会参考</strong>
          <ul>
            <li>阶段性画像</li>
            {reflectionSession.profileSupplement ? <li>你的补充</li> : null}
            <li>{generatedProfile?.metadata.sources.length ?? 0} 条画像来源</li>
            <li>{reflectionSession.messages.length} 条已保存对话</li>
          </ul>
          <p>材料只在你明确生成画像或发起对话时发送给所配置的模型服务。</p>
        </aside>

        <section className="conversation" aria-label="对话记录">
          {reflectionSession.messages.length ? (
            <div className="message-list">
              {reflectionSession.messages.map((message) => (
                <article className={`message ${message.role}`} key={`${message.createdAt}-${message.content}`}>
                  <span>{message.role === 'user' ? '你' : 'AI'}</span>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="chat-box">
              <p>可以直接问，也可以先让 AI 从画像里找一个值得继续聊的问题。</p>
            </div>
          )}
          <button className="secondary-action prompt-action" onClick={() => void sendChatMessage('从这份画像看，我现在最值得继续问自己的问题是什么？')}>
            帮我找一个切入口
          </button>

          <label className="large-answer chat-composer">
            想聊什么？
            <textarea
              placeholder="比如：我为什么总在稳定和自由之间犹豫？"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
          </label>
          <div className="actions-row">
            <button className="primary-action" onClick={() => void sendChatMessage()} disabled={!chatInput.trim() || sendingChat}>
              {sendingChat ? '正在回复' : '发送'}
            </button>
          </div>
        </section>
      </div>
    </Panel>
  );
}

async function requestModelText(config: { baseUrl: string; apiKey: string; model: string }, prompts: string[], temperature = 0.6, maxTokens = 800) {
  const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompts.filter(Boolean).join('\n\n') }],
      temperature,
      max_tokens: maxTokens
    })
  });
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content ?? '';
}

function Panel({
  icon,
  kicker,
  title,
  body,
  children
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-icon">{icon}</div>
      <p className="eyebrow">{kicker}</p>
      <h2>{title}</h2>
      <p className="panel-body">{body}</p>
      {children}
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="info-card">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

declare global {
  interface BrowserDirectoryHandle {
    kind: 'directory';
    name: string;
    getDirectoryHandle(
      name: string,
      options?: {
        create?: boolean;
      }
    ): Promise<BrowserDirectoryHandle>;
    getFileHandle?(
      name: string,
      options?: {
        create?: boolean;
      }
    ): Promise<{
      getFile?: () => Promise<{
        text: () => Promise<string>;
      }>;
      createWritable: () => Promise<{
        write: (value: string | Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  }

  interface Window {
    showDirectoryPicker?: () => Promise<BrowserDirectoryHandle>;
  }
}
