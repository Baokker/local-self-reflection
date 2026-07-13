import { emptyMaterialIndex, indexMaterial, type MaterialIndex } from './retrieval';
import type { ReflectionReport, ReportType } from './reports';

export const WORKSPACE_DIR = 'ai-self-analysis';
export const WORKSPACE_SUBDIRECTORIES = ['materials', 'sessions', 'profiles', 'reports', 'index'] as const;
export const SUPPORTED_IMPORT_EXTENSIONS = ['.md', '.txt', '.csv', '.json'] as const;

type DirectoryLike = {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryLike>;
};

type DirectoryWithFiles = DirectoryLike & {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
};

type FileHandleLike = {
  getFile?: () => Promise<{
    text: () => Promise<string>;
  }>;
  createWritable(): Promise<{
    write(value: string | Blob): Promise<void>;
    close(): Promise<void>;
  }>;
};

export type ImportedMaterial = {
  originalName: string;
  storedName: string;
  extension: string;
  importedAt: string;
  kind?: 'file' | 'note';
};

export type WorkspaceMetadata = {
  materials: ImportedMaterial[];
};

export type OnboardingAnswerRecord = {
  questionId?: string;
  question: string;
  answer: string;
  stepIndex: number;
  followUpPrompt?: string;
};

export type OnboardingSession = {
  currentStep: number;
  completed: boolean;
  answers: OnboardingAnswerRecord[];
};

export type SavedProfile = {
  profile: string;
  metadata: {
    sources: string[];
    generatedAt: string;
    pipeline: 'bounded-profile-v1';
  };
};

export type ProfileVersion = SavedProfile & {
  id: string;
};

export type ProfileManifestEntry = {
  id: string;
  fileName: string;
  createdAt: string;
  sourceCount: number;
};

export type ProfileManifest = {
  currentProfileId: string | null;
  versions: ProfileManifestEntry[];
};

export type ProfileHistory = {
  currentProfileId: string | null;
  versions: ProfileVersion[];
};

export type ReflectionMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: string[];
};

export type ReflectionSession = {
  profileSupplement: string;
  messages: ReflectionMessage[];
};

export type ChatSession = ReflectionSession & {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatManifestEntry = {
  id: string;
  title: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
};

export type ChatManifest = {
  activeChatId: string | null;
  chats: ChatManifestEntry[];
};

export type ChatWorkspace = {
  manifest: ChatManifest;
  activeSession: ChatSession | null;
};

export type ReportManifestEntry = {
  id: string;
  type: ReportType;
  title: string;
  fileName: string;
  createdAt: string;
};

export type ReportManifest = {
  reports: ReportManifestEntry[];
};

export async function createWorkspaceStructure(root: DirectoryLike) {
  const workspace = await root.getDirectoryHandle(WORKSPACE_DIR, { create: true });
  for (const directory of WORKSPACE_SUBDIRECTORIES) {
    await workspace.getDirectoryHandle(directory, { create: true });
  }
  return workspace;
}

export function safeWorkspacePath(segments: string[]) {
  for (const segment of segments) {
    if (!segment || segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
      throw new Error('Refusing to write outside ai-self-analysis.');
    }
  }
  return [WORKSPACE_DIR, ...segments].join('/');
}

export function isSupportedMaterialFile(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return SUPPORTED_IMPORT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function importMaterialFile(root: DirectoryWithFiles, file: File): Promise<ImportedMaterial> {
  if (!isSupportedMaterialFile(file.name)) {
    throw new Error('The MVP supports .md, .txt, .csv, and .json files.');
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const workspace = (await createWorkspaceStructure(root)) as DirectoryWithFiles;
  const materials = (await workspace.getDirectoryHandle('materials', { create: true })) as DirectoryWithFiles;
  const storedName = uniqueMaterialName(file.name);
  const content = await readFileText(file);
  safeWorkspacePath(['materials', storedName]);
  const target = await materials.getFileHandle(storedName, { create: true });
  const writable = await target.createWritable();
  await writable.write(content);
  await writable.close();

  const imported = {
    originalName: file.name,
    storedName,
    extension,
    importedAt: new Date().toISOString(),
    kind: 'file' as const
  };

  const metadata = await loadWorkspaceMetadata(root);
  metadata.materials.push(imported);
  await writeWorkspaceFile(root, ['index', 'materials.json'], JSON.stringify(metadata, null, 2));

  const index = await loadMaterialIndex(root);
  index.chunks = [
    ...index.chunks.filter((chunk) => chunk.storedName !== storedName),
    ...indexMaterial({ sourceName: file.name, storedName, text: content })
  ];
  index.updatedAt = new Date().toISOString();
  await writeWorkspaceFile(root, ['index', 'material-chunks.json'], JSON.stringify(index, null, 2));

  return imported;
}

export async function createTextMaterial(
  root: DirectoryWithFiles,
  input: { title: string; content: string }
): Promise<ImportedMaterial> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) throw new Error('Title and content are required.');

  const originalName = `${title}.md`;
  const storedName = uniqueMaterialName(originalName);
  const text = `# ${title}\n\n${content}\n`;
  const workspace = (await createWorkspaceStructure(root)) as DirectoryWithFiles;
  const materials = (await workspace.getDirectoryHandle('materials', { create: true })) as DirectoryWithFiles;
  const target = await materials.getFileHandle(storedName, { create: true });
  const writable = await target.createWritable();
  await writable.write(text);
  await writable.close();

  const material: ImportedMaterial = {
    originalName,
    storedName,
    extension: '.md',
    importedAt: new Date().toISOString(),
    kind: 'note'
  };
  const metadata = await loadWorkspaceMetadata(root);
  metadata.materials.push(material);
  await writeWorkspaceFile(root, ['index', 'materials.json'], JSON.stringify(metadata, null, 2));

  const index = await loadMaterialIndex(root);
  index.chunks = [
    ...index.chunks,
    ...indexMaterial({ sourceName: originalName, storedName, text })
  ];
  index.updatedAt = new Date().toISOString();
  await writeWorkspaceFile(root, ['index', 'material-chunks.json'], JSON.stringify(index, null, 2));
  return material;
}

export async function loadWorkspaceMetadata(root: DirectoryLike): Promise<WorkspaceMetadata> {
  const existing = await readWorkspaceFile(root, ['index', 'materials.json']);
  if (!existing) {
    return { materials: [] };
  }

  try {
    return JSON.parse(existing) as WorkspaceMetadata;
  } catch {
    return { materials: [] };
  }
}

export async function loadMaterialIndex(root: DirectoryLike): Promise<MaterialIndex> {
  const existing = await readWorkspaceFile(root, ['index', 'material-chunks.json']);
  if (!existing) return emptyMaterialIndex();
  try {
    return JSON.parse(existing) as MaterialIndex;
  } catch {
    return emptyMaterialIndex();
  }
}

export async function saveOnboardingAnswer(
  root: DirectoryWithFiles,
  input: OnboardingAnswerRecord & { completed: boolean }
) {
  const existing = (await loadOnboardingSession(root)) ?? {
    currentStep: 0,
    completed: false,
    answers: []
  };

  const nextAnswers = existing.answers.filter((item) => item.stepIndex !== input.stepIndex);
  nextAnswers.push({
    questionId: input.questionId,
    question: input.question,
    answer: input.answer,
    stepIndex: input.stepIndex,
    followUpPrompt: input.followUpPrompt
  });
  nextAnswers.sort((left, right) => left.stepIndex - right.stepIndex);

  const next: OnboardingSession = {
    currentStep: input.stepIndex,
    completed: input.completed,
    answers: nextAnswers
  };

  await writeWorkspaceFile(root, ['sessions', 'onboarding-session.json'], JSON.stringify(next, null, 2));
}

export async function loadOnboardingSession(root: DirectoryLike): Promise<OnboardingSession | null> {
  const existing = await readWorkspaceFile(root, ['sessions', 'onboarding-session.json']);
  if (!existing) return null;

  try {
    return JSON.parse(existing) as OnboardingSession;
  } catch {
    return null;
  }
}

export async function startNewOnboardingSession(root: DirectoryWithFiles) {
  const session: OnboardingSession = {
    currentStep: 0,
    completed: false,
    answers: []
  };
  await writeWorkspaceFile(root, ['sessions', 'onboarding-session.json'], JSON.stringify(session, null, 2));
  return session;
}

export async function saveGeneratedProfile(root: DirectoryWithFiles, profile: SavedProfile) {
  const manifest = await ensureProfileManifest(root);
  const id = await createAvailableProfileId(root, manifest, profile.metadata.generatedAt);
  const version: ProfileVersion = { id, ...profile };
  const entry: ProfileManifestEntry = {
    id,
    fileName: `${id}.json`,
    createdAt: profile.metadata.generatedAt,
    sourceCount: profile.metadata.sources.length
  };

  await writeWorkspaceFile(root, ['profiles', 'versions', entry.fileName], JSON.stringify(version, null, 2));
  await writeProfileManifest(root, {
    currentProfileId: id,
    versions: [...manifest.versions, entry]
  });
  return version;
}

export async function loadLatestProfile(root: DirectoryLike): Promise<SavedProfile | null> {
  const manifest = await readProfileManifest(root);
  if (manifest?.currentProfileId) {
    const entry = manifest.versions.find((item) => item.id === manifest.currentProfileId);
    if (entry) {
      const version = await readProfileVersion(root, entry.fileName);
      if (version) return version;
    }
  }

  const existing = await readWorkspaceFile(root, ['profiles', 'current-self-profile.json']);
  if (!existing) return null;

  try {
    return JSON.parse(existing) as SavedProfile;
  } catch {
    return null;
  }
}

export async function loadProfileHistory(root: DirectoryLike): Promise<ProfileHistory> {
  const manifest = await readProfileManifest(root);
  if (!manifest) return { currentProfileId: null, versions: [] };

  const versions = (await Promise.all(
    manifest.versions.map((entry) => readProfileVersion(root, entry.fileName))
  )).filter((version): version is ProfileVersion => Boolean(version));

  versions.sort((left, right) => right.metadata.generatedAt.localeCompare(left.metadata.generatedAt));
  return {
    currentProfileId: manifest.currentProfileId,
    versions
  };
}

export async function ensureProfileHistory(root: DirectoryWithFiles): Promise<ProfileHistory> {
  await ensureProfileManifest(root);
  return loadProfileHistory(root);
}

export async function saveReflectionSession(root: DirectoryWithFiles, session: ReflectionSession) {
  await writeWorkspaceFile(root, ['sessions', 'reflection-session.json'], JSON.stringify(session, null, 2));
}

export async function loadReflectionSession(root: DirectoryLike): Promise<ReflectionSession | null> {
  const existing = await readWorkspaceFile(root, ['sessions', 'reflection-session.json']);
  if (!existing) return null;

  try {
    return JSON.parse(existing) as ReflectionSession;
  } catch {
    return null;
  }
}

export async function ensureChatWorkspace(root: DirectoryWithFiles): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  return loadChatWorkspaceFromManifest(root, manifest);
}

export async function createChatSession(
  root: DirectoryWithFiles,
  input: { title?: string; profileSupplement?: string } = {}
): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const now = new Date().toISOString();
  const id = await createAvailableChatId(root, manifest, now);
  const session: ChatSession = {
    id,
    title: input.title?.trim() || '新的对话',
    profileSupplement: input.profileSupplement?.trim() || '',
    messages: [],
    createdAt: now,
    updatedAt: now
  };
  const entry = chatEntryFromSession(session);

  await writeChatSession(root, session);
  const nextManifest = {
    activeChatId: id,
    chats: [...manifest.chats, entry]
  };
  await writeChatManifest(root, nextManifest);
  return { manifest: sortChatManifest(nextManifest), activeSession: session };
}

export async function saveChatSession(root: DirectoryWithFiles, session: ChatSession): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const nextSession = {
    ...session,
    title: session.title.trim() || '未命名对话',
    updatedAt: new Date().toISOString()
  };
  await writeChatSession(root, nextSession);

  const previousEntry = manifest.chats.find((item) => item.id === nextSession.id);
  const entry = {
    ...chatEntryFromSession(nextSession),
    archivedAt: previousEntry?.archivedAt,
    deletedAt: previousEntry?.deletedAt
  };
  const nextManifest = {
    activeChatId: nextSession.id,
    chats: [...manifest.chats.filter((item) => item.id !== nextSession.id), entry]
  };
  await writeChatManifest(root, nextManifest);
  return { manifest: sortChatManifest(nextManifest), activeSession: nextSession };
}

export async function activateChatSession(root: DirectoryWithFiles, chatId: string): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const entry = manifest.chats.find((item) => item.id === chatId);
  if (!entry) return loadChatWorkspaceFromManifest(root, manifest);

  const nextManifest = { ...manifest, activeChatId: chatId };
  await writeChatManifest(root, nextManifest);
  return {
    manifest: sortChatManifest(nextManifest),
    activeSession: await readChatSession(root, entry.fileName)
  };
}

export async function renameChatSession(
  root: DirectoryWithFiles,
  chatId: string,
  title: string
): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const entry = manifest.chats.find((item) => item.id === chatId);
  if (!entry) return loadChatWorkspaceFromManifest(root, manifest);
  const session = await readChatSession(root, entry.fileName);
  if (!session) return loadChatWorkspaceFromManifest(root, manifest);
  return saveChatSession(root, { ...session, title: title.trim() || '未命名对话' });
}

export async function setChatArchived(
  root: DirectoryWithFiles,
  chatId: string,
  archived: boolean
): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const nextChats = manifest.chats.map((entry) => entry.id === chatId
    ? { ...entry, archivedAt: archived ? new Date().toISOString() : undefined }
    : entry);
  const nextActiveId = archived
    ? chooseNextActiveChat(nextChats, manifest.activeChatId === chatId ? null : manifest.activeChatId)
    : chatId;
  const nextManifest = { activeChatId: nextActiveId, chats: nextChats };
  await writeChatManifest(root, nextManifest);
  return loadChatWorkspaceFromManifest(root, nextManifest);
}

export async function softDeleteChatSession(
  root: DirectoryWithFiles,
  chatId: string
): Promise<ChatWorkspace> {
  const manifest = await ensureChatManifest(root);
  const nextChats = manifest.chats.map((entry) => entry.id === chatId
    ? { ...entry, deletedAt: new Date().toISOString() }
    : entry);
  const nextActiveId = chooseNextActiveChat(
    nextChats,
    manifest.activeChatId === chatId ? null : manifest.activeChatId
  );
  const nextManifest = { activeChatId: nextActiveId, chats: nextChats };
  await writeChatManifest(root, nextManifest);
  return loadChatWorkspaceFromManifest(root, nextManifest);
}

export async function saveReflectionReport(
  root: DirectoryWithFiles,
  input: Omit<ReflectionReport, 'id'>
): Promise<ReflectionReport> {
  const manifest = await readReportManifest(root);
  const id = await createAvailableReportId(root, manifest, input.createdAt, input.type);
  const report: ReflectionReport = { id, ...input };
  const entry: ReportManifestEntry = {
    id,
    type: report.type,
    title: report.title,
    fileName: `${id}.json`,
    createdAt: report.createdAt
  };
  await writeWorkspaceFile(root, ['reports', entry.fileName], JSON.stringify(report, null, 2));
  await writeWorkspaceFile(root, ['reports', 'manifest.json'], JSON.stringify({
    reports: [...manifest.reports, entry]
  }, null, 2));
  return report;
}

export async function loadReflectionReports(root: DirectoryLike): Promise<ReflectionReport[]> {
  const manifest = await readReportManifest(root);
  const reports = (await Promise.all(manifest.reports.map(async (entry) => {
    const existing = await readWorkspaceFile(root, ['reports', entry.fileName]);
    if (!existing) return null;
    try {
      return JSON.parse(existing) as ReflectionReport;
    } catch {
      return null;
    }
  }))).filter((report): report is ReflectionReport => Boolean(report));
  return reports.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function uniqueMaterialName(fileName: string) {
  const safeName = fileName.replace(/[^\w.\-\u4e00-\u9fff]/g, '_');
  return `${Date.now()}-${safeName}`;
}

async function readFileText(file: File) {
  if ('text' in file && typeof file.text === 'function') {
    return file.text();
  }
  if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
    return new TextDecoder().decode(await file.arrayBuffer());
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function writeWorkspaceFile(root: DirectoryLike, segments: string[], content: string) {
  const fileName = segments[segments.length - 1];
  const directories = segments.slice(0, -1);
  const workspace = (await createWorkspaceStructure(root)) as DirectoryWithFiles;
  let current: DirectoryWithFiles = workspace;

  for (const directory of directories) {
    current = (await current.getDirectoryHandle(directory, { create: true })) as DirectoryWithFiles;
  }

  const target = await current.getFileHandle(fileName, { create: true });
  const writable = await target.createWritable();
  await writable.write(content);
  await writable.close();
}

async function readWorkspaceFile(root: DirectoryLike, segments: string[]) {
  try {
    let current = await root.getDirectoryHandle(WORKSPACE_DIR);
    for (const directory of segments.slice(0, -1)) {
      current = await current.getDirectoryHandle(directory);
    }
    const target = await (current as DirectoryWithFiles).getFileHandle(segments[segments.length - 1]);
    if (!target.getFile) return null;
    const file = await target.getFile();
    return file.text();
  } catch {
    return null;
  }
}

async function ensureChatManifest(root: DirectoryWithFiles): Promise<ChatManifest> {
  const existing = await readChatManifest(root);
  if (existing) return existing;

  const legacy = await loadReflectionSession(root);
  if (!legacy) {
    const empty: ChatManifest = { activeChatId: null, chats: [] };
    await writeChatManifest(root, empty);
    return empty;
  }

  const createdAt = legacy.messages[0]?.createdAt ?? new Date().toISOString();
  const updatedAt = legacy.messages.at(-1)?.createdAt ?? createdAt;
  const emptyManifest: ChatManifest = { activeChatId: null, chats: [] };
  const id = await createAvailableChatId(root, emptyManifest, createdAt, 'legacy-chat');
  const session: ChatSession = {
    id,
    title: legacy.messages.find((message) => message.role === 'user')?.content.slice(0, 24) || '第一次对话',
    profileSupplement: legacy.profileSupplement,
    messages: legacy.messages,
    createdAt,
    updatedAt
  };
  const manifest: ChatManifest = {
    activeChatId: id,
    chats: [chatEntryFromSession(session)]
  };
  await writeChatSession(root, session);
  await writeChatManifest(root, manifest);
  return manifest;
}

async function readReportManifest(root: DirectoryLike): Promise<ReportManifest> {
  const existing = await readWorkspaceFile(root, ['reports', 'manifest.json']);
  if (!existing) return { reports: [] };
  try {
    return JSON.parse(existing) as ReportManifest;
  } catch {
    return { reports: [] };
  }
}

async function createAvailableReportId(
  root: DirectoryLike,
  manifest: ReportManifest,
  createdAt: string,
  type: ReportType
) {
  const timestamp = createdAt.replace(/[^0-9]/g, '').slice(0, 17) || String(Date.now());
  const base = `${timestamp}-${type}`;
  let candidate = base;
  let suffix = 2;
  while (
    manifest.reports.some((item) => item.id === candidate) ||
    await readWorkspaceFile(root, ['reports', `${candidate}.json`])
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function readChatManifest(root: DirectoryLike): Promise<ChatManifest | null> {
  const existing = await readWorkspaceFile(root, ['sessions', 'chats', 'manifest.json']);
  if (!existing) return null;
  try {
    return JSON.parse(existing) as ChatManifest;
  } catch {
    return null;
  }
}

async function writeChatManifest(root: DirectoryWithFiles, manifest: ChatManifest) {
  await writeWorkspaceFile(root, ['sessions', 'chats', 'manifest.json'], JSON.stringify(manifest, null, 2));
}

async function readChatSession(root: DirectoryLike, fileName: string): Promise<ChatSession | null> {
  const existing = await readWorkspaceFile(root, ['sessions', 'chats', fileName]);
  if (!existing) return null;
  try {
    return JSON.parse(existing) as ChatSession;
  } catch {
    return null;
  }
}

async function writeChatSession(root: DirectoryWithFiles, session: ChatSession) {
  await writeWorkspaceFile(root, ['sessions', 'chats', `${session.id}.json`], JSON.stringify(session, null, 2));
}

async function loadChatWorkspaceFromManifest(
  root: DirectoryLike,
  manifest: ChatManifest
): Promise<ChatWorkspace> {
  const sortedManifest = sortChatManifest(manifest);
  const activeEntry = sortedManifest.chats.find((item) =>
    item.id === sortedManifest.activeChatId && !item.deletedAt
  );
  return {
    manifest: sortedManifest,
    activeSession: activeEntry ? await readChatSession(root, activeEntry.fileName) : null
  };
}

function chooseNextActiveChat(chats: ChatManifestEntry[], preferredId: string | null) {
  const activeChats = chats.filter((entry) => !entry.archivedAt && !entry.deletedAt);
  if (preferredId && activeChats.some((entry) => entry.id === preferredId)) return preferredId;
  return sortChatManifest({ activeChatId: null, chats: activeChats }).chats[0]?.id ?? null;
}

function sortChatManifest(manifest: ChatManifest): ChatManifest {
  return {
    ...manifest,
    chats: [...manifest.chats].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  };
}

function chatEntryFromSession(session: ChatSession): ChatManifestEntry {
  return {
    id: session.id,
    title: session.title,
    fileName: `${session.id}.json`,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

async function createAvailableChatId(
  root: DirectoryLike,
  manifest: ChatManifest,
  createdAt: string,
  prefix = 'chat'
) {
  const timestamp = createdAt.replace(/[^0-9]/g, '').slice(0, 17) || String(Date.now());
  const base = `${prefix}-${timestamp}`;
  let candidate = base;
  let suffix = 2;
  while (
    manifest.chats.some((item) => item.id === candidate) ||
    await readWorkspaceFile(root, ['sessions', 'chats', `${candidate}.json`])
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function ensureProfileManifest(root: DirectoryWithFiles): Promise<ProfileManifest> {
  const existing = await readProfileManifest(root);
  if (existing) return existing;

  const legacy = await readLegacyProfile(root);
  if (!legacy) {
    const empty: ProfileManifest = { currentProfileId: null, versions: [] };
    await writeProfileManifest(root, empty);
    return empty;
  }

  const emptyManifest: ProfileManifest = { currentProfileId: null, versions: [] };
  const id = await createAvailableProfileId(root, emptyManifest, legacy.metadata.generatedAt, 'legacy-profile');
  const version: ProfileVersion = { id, ...legacy };
  const entry: ProfileManifestEntry = {
    id,
    fileName: `${id}.json`,
    createdAt: legacy.metadata.generatedAt,
    sourceCount: legacy.metadata.sources.length
  };
  const manifest: ProfileManifest = {
    currentProfileId: id,
    versions: [entry]
  };

  await writeWorkspaceFile(root, ['profiles', 'versions', entry.fileName], JSON.stringify(version, null, 2));
  await writeProfileManifest(root, manifest);
  return manifest;
}

async function readProfileManifest(root: DirectoryLike): Promise<ProfileManifest | null> {
  const existing = await readWorkspaceFile(root, ['profiles', 'manifest.json']);
  if (!existing) return null;
  try {
    return JSON.parse(existing) as ProfileManifest;
  } catch {
    return null;
  }
}

async function writeProfileManifest(root: DirectoryWithFiles, manifest: ProfileManifest) {
  await writeWorkspaceFile(root, ['profiles', 'manifest.json'], JSON.stringify(manifest, null, 2));
}

async function readProfileVersion(root: DirectoryLike, fileName: string): Promise<ProfileVersion | null> {
  const existing = await readWorkspaceFile(root, ['profiles', 'versions', fileName]);
  if (!existing) return null;
  try {
    return JSON.parse(existing) as ProfileVersion;
  } catch {
    return null;
  }
}

async function readLegacyProfile(root: DirectoryLike): Promise<SavedProfile | null> {
  const existing = await readWorkspaceFile(root, ['profiles', 'current-self-profile.json']);
  if (!existing) return null;
  try {
    const parsed = JSON.parse(existing) as SavedProfile;
    return parsed.profile && parsed.metadata?.generatedAt ? parsed : null;
  } catch {
    return null;
  }
}

async function createAvailableProfileId(
  root: DirectoryLike,
  manifest: ProfileManifest,
  generatedAt: string,
  prefix = 'profile'
) {
  const timestamp = generatedAt.replace(/[^0-9]/g, '').slice(0, 17) || String(Date.now());
  const base = `${prefix}-${timestamp}`;
  let candidate = base;
  let suffix = 2;

  while (
    manifest.versions.some((item) => item.id === candidate) ||
    await readWorkspaceFile(root, ['profiles', 'versions', `${candidate}.json`])
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
