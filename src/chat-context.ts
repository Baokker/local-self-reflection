import type { MaterialIndex, RetrievedChunk } from './retrieval';
import type { ChatContextSettings, ReflectionMessage } from './workspace';

export function resolveChatContext(
  context: ChatContextSettings | undefined,
  currentProfileId: string | null,
  materialStoredNames: string[]
): ChatContextSettings {
  return {
    profileId: context?.profileId ?? currentProfileId,
    materialStoredNames: context?.materialStoredNames ?? materialStoredNames,
    recentMessageLimit: context?.recentMessageLimit ?? 6
  };
}

export function filterMaterialIndex(index: MaterialIndex, selectedStoredNames: string[]): MaterialIndex {
  const selected = new Set(selectedStoredNames);
  return {
    ...index,
    chunks: index.chunks.filter((chunk) => selected.has(chunk.storedName))
  };
}

export function buildChatPrompts(input: {
  profile: string;
  profileSupplement: string;
  retrievedChunks: RetrievedChunk[];
  messages: ReflectionMessage[];
  recentMessageLimit: number;
  question: string;
}) {
  return [
    '只根据下面给出的阶段画像、用户补充、本地材料摘录和最近对话回答问题。',
    '说具体一点，少用套话。可以指出不确定之处，但不要做心理诊断，也不要假装读过未提供的材料。',
    `阶段性自我画像：\n${input.profile}`,
    input.profileSupplement ? `用户对画像的补充：\n${input.profileSupplement}` : '',
    input.retrievedChunks.length
      ? `本地材料摘录：\n${input.retrievedChunks.map((chunk) => `【${chunk.sourceName}】\n${chunk.text}`).join('\n\n')}`
      : '这次没有找到与问题直接匹配的本地材料摘录。',
    `最近对话：\n${input.messages.slice(-input.recentMessageLimit).map((message) => `${message.role === 'user' ? '用户' : 'AI'}：${message.content}`).join('\n')}`,
    `用户提问：${input.question}`
  ];
}
