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

export type ReflectionMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type ReflectionSession = {
  profileSupplement: string;
  messages: ReflectionMessage[];
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
  safeWorkspacePath(['materials', storedName]);
  const target = await materials.getFileHandle(storedName, { create: true });
  const writable = await target.createWritable();
  await writable.write(await readFileText(file));
  await writable.close();

  const imported = {
    originalName: file.name,
    storedName,
    extension,
    importedAt: new Date().toISOString()
  };

  const metadata = await loadWorkspaceMetadata(root);
  metadata.materials.push(imported);
  await writeWorkspaceFile(root, ['index', 'materials.json'], JSON.stringify(metadata, null, 2));

  return imported;
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

export async function saveGeneratedProfile(root: DirectoryWithFiles, profile: SavedProfile) {
  await writeWorkspaceFile(root, ['profiles', 'current-self-profile.json'], JSON.stringify(profile, null, 2));
}

export async function loadLatestProfile(root: DirectoryLike): Promise<SavedProfile | null> {
  const existing = await readWorkspaceFile(root, ['profiles', 'current-self-profile.json']);
  if (!existing) return null;

  try {
    return JSON.parse(existing) as SavedProfile;
  } catch {
    return null;
  }
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

function uniqueMaterialName(fileName: string) {
  const safeName = fileName.replace(/[^\w.\-\u4e00-\u9fff]/g, '_');
  return `${Date.now()}-${safeName}`;
}

async function readFileText(file: File) {
  if ('text' in file && typeof file.text === 'function') {
    return file.text();
  }
  return new TextDecoder().decode(await file.arrayBuffer());
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
