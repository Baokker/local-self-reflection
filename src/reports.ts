export type ReportType = 'stage-review' | 'swot';

export type ReflectionReport = {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  createdAt: string;
  sources: string[];
};

export function reportTitle(type: ReportType) {
  return type === 'stage-review' ? '阶段复盘' : '个人 SWOT';
}

export function buildReportPrompt(input: {
  type: ReportType;
  profile: string;
  profileSupplement?: string;
  materialExcerpts?: Array<{ sourceName: string; text: string }>;
}) {
  const common = [
    '请用简体中文，根据下面给出的阶段画像、用户补充和材料摘录写报告。',
    '只写有材料依据的内容。把事实、推测和仍不确定的地方分开，不做心理诊断，也不给医疗建议。',
    `阶段画像：\n${input.profile}`,
    input.profileSupplement ? `用户补充：\n${input.profileSupplement}` : '',
    input.materialExcerpts?.length
      ? `材料摘录：\n${input.materialExcerpts.map((item) => `【${item.sourceName}】\n${item.text}`).join('\n\n')}`
      : ''
  ];

  if (input.type === 'swot') {
    return [
      ...common,
      '请分成“优势、短板、机会、风险”四部分。每部分写 2 到 4 条，并说明依据。',
      '最后写一段不超过 150 字的行动建议。不要把短板或风险写成人格定论。'
    ].filter(Boolean).join('\n\n');
  }

  return [
    ...common,
    '请整理这段时间发生了什么、哪些模式反复出现、目前最难处理的矛盾，以及接下来一个月可以尝试的小动作。',
    '报告分成 3 到 5 个短小节，语气平实。遇到证据不足的判断，直接写“目前还看不清”。'
  ].filter(Boolean).join('\n\n');
}
