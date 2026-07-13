import type { OnboardingAnswerRecord } from './workspace';

export type ReflectionQuestion = {
  id: string;
  prompt: string;
  title: string;
};

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: 'recurring-thought',
    title: '最近什么事总在脑子里打转？',
    prompt: '最近反复想到的是什么？'
  },
  {
    id: 'energy-drain',
    title: '最近什么事情最消耗你？',
    prompt: '哪件事让你最容易觉得累、烦，或者提不起劲？'
  },
  {
    id: 'alive-moment',
    title: '什么时候，你觉得自己状态不错？',
    prompt: '回想最近一次感觉轻松、投入或有精神的时刻，当时发生了什么？'
  },
  {
    id: 'current-choice',
    title: '现在有什么选择让你拿不定主意？',
    prompt: '你在犹豫什么？两边分别吸引你、又让你担心什么？'
  },
  {
    id: 'desired-change',
    title: '如果能调整生活的一部分，你想先动哪里？',
    prompt: '不用考虑完整方案，只写下你最想先改变的那一处。'
  },
  {
    id: 'next-month',
    title: '接下来一个月，你希望生活有什么不同？',
    prompt: '一个月后，出现什么小变化，会让你觉得这段时间没有白过？'
  }
];

export function findNextQuestionIndex(answers: OnboardingAnswerRecord[]) {
  const firstUnanswered = REFLECTION_QUESTIONS.findIndex((_, index) => {
    const record = answers.find((item) => item.stepIndex === index + 1);
    return !record?.answer.trim();
  });

  return firstUnanswered === -1 ? REFLECTION_QUESTIONS.length - 1 : firstUnanswered;
}
