import { describe, expect, it } from 'vitest';
import { REFLECTION_QUESTIONS, findNextQuestionIndex } from './onboarding';

describe('guided reflection questions', () => {
  it('defines six fixed Simplified Chinese questions', () => {
    expect(REFLECTION_QUESTIONS).toHaveLength(6);
    expect(REFLECTION_QUESTIONS.map((item) => item.id)).toEqual([
      'recurring-thought',
      'energy-drain',
      'alive-moment',
      'current-choice',
      'desired-change',
      'next-month'
    ]);
  });

  it('resumes at the first unanswered question', () => {
    expect(findNextQuestionIndex([])).toBe(0);
    expect(findNextQuestionIndex([
      { question: 'q1', answer: 'a1', stepIndex: 1 }
    ])).toBe(1);
    expect(findNextQuestionIndex(REFLECTION_QUESTIONS.map((item, index) => ({
      question: item.prompt,
      answer: `a${index + 1}`,
      stepIndex: index + 1
    })))).toBe(5);
  });
});
