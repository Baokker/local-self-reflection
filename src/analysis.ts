export type AnalysisModel = {
  complete(request: { step: 'themes' | 'profile'; prompt: string }): Promise<string>;
};

export type MaterialInput = {
  name: string;
  text: string;
};

export type OnboardingAnswer = {
  question: string;
  answer: string;
};

export type ProfilePipelineInput = {
  model: AnalysisModel;
  materials: MaterialInput[];
  answers: OnboardingAnswer[];
  maxMaterialChars?: number;
};

export type ProfilePipelineResult = {
  profile: string;
  intermediate: {
    themes: string;
  };
  metadata: {
    sources: string[];
    generatedAt: string;
    pipeline: 'bounded-profile-v1';
  };
};

export async function buildProfilePipeline({
  model,
  materials,
  answers,
  maxMaterialChars = 1200
}: ProfilePipelineInput): Promise<ProfilePipelineResult> {
  const materialContext = materials
    .map((material) => `【${material.name}】\n${clip(material.text, maxMaterialChars)}`)
    .join('\n\n');
  const answerContext = answers
    .map((item) => `问题：${item.question}\n回答：${item.answer}`)
    .join('\n\n');

  const themes = await model.complete({
    step: 'themes',
    prompt: [
      '先整理下面这些材料里反复出现的事情。写清楚用户在意什么、哪里拿不定主意，以及哪些说法只是你的推测。',
      '引用具体内容，不要套用通用人格描述。不要做心理诊断，也不要给医疗建议。',
      materialContext,
      answerContext
    ]
      .filter(Boolean)
      .join('\n\n')
  });

  const profile = await model.complete({
    step: 'profile',
    prompt: [
      '请用简体中文写一份阶段性自我画像。',
      '先用一段自然的话回应用户，再用 2 到 4 个短小节整理目前看见的线索。区分材料里的事实和你的推测。',
      '少用“你正在寻找”“内在需要”“值得探索”这类套话。不要把用户当病人，也不要做心理诊断。',
      `整理出的线索：\n${themes}`,
      materialContext,
      answerContext
    ]
      .filter(Boolean)
      .join('\n\n')
  });

  return {
    profile,
    intermediate: { themes },
    metadata: {
      sources: [
        ...materials.map((material) => material.name),
        ...answers.map((item) => `onboarding:${item.question}`)
      ],
      generatedAt: new Date().toISOString(),
      pipeline: 'bounded-profile-v1'
    }
  };
}

function clip(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n……（已截断）`;
}
