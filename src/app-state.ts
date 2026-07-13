import { loadStoredModelConfig, type ModelConfig } from './model';
import { createWorkspaceStructure, loadOnboardingSession, WORKSPACE_DIR } from './workspace';

export type Step = 'welcome' | 'workspace' | 'model' | 'import' | 'onboarding' | 'profile' | 'chat';

export type PickerDirectoryHandle = {
  kind: 'directory';
  name: string;
  getDirectoryHandle(
    name: string,
    options?: {
      create?: boolean;
    }
  ): Promise<PickerDirectoryHandle>;
  getFileHandle?(
    name: string,
    options?: {
      create?: boolean;
    }
  ): Promise<unknown>;
};

export type WorkspaceState = {
  handle: PickerDirectoryHandle | null;
  name: string;
  existingWorkspace: boolean;
  statusMessage: string;
};

export type AppState = {
  step: Step;
  workspace: WorkspaceState;
  modelConfig: ModelConfig;
  onboardingSession: {
    currentStep: number;
    completed: boolean;
    answers: Array<{
      question: string;
      answer: string;
      stepIndex: number;
    }>;
  } | null;
};

export function createInitialAppState(): AppState {
  return {
    step: 'welcome',
    workspace: {
      handle: null,
      name: '',
      existingWorkspace: false,
      statusMessage: ''
    },
    modelConfig: loadStoredModelConfig(),
    onboardingSession: null
  };
}

export async function handleWorkspacePicked(
  state: AppState,
  root: PickerDirectoryHandle
): Promise<AppState> {
  const existingWorkspace = await hasExistingWorkspace(root);
  await createWorkspaceStructure(root);
  const onboardingSession = await loadOnboardingSession(root);
  const shouldResumeOnboarding = Boolean(onboardingSession && !onboardingSession.completed);

  return {
    ...state,
    step: shouldResumeOnboarding ? 'onboarding' : 'model',
    workspace: {
      handle: root,
      name: root.name,
      existingWorkspace,
      statusMessage: shouldResumeOnboarding
        ? '上次写到一半的内容还在，可以接着写。'
        : existingWorkspace
          ? '这个文件夹里已经有 ai-self-analysis/，原来的内容会保留。'
          : '已经建好 ai-self-analysis/，接下来的内容会放在这里。'
    },
    onboardingSession
  };
}

async function hasExistingWorkspace(root: PickerDirectoryHandle) {
  try {
    await root.getDirectoryHandle(WORKSPACE_DIR);
    return true;
  } catch {
    return false;
  }
}
