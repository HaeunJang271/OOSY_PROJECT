/** 짧은 문단형 강좌: 세 칸 입력을 하나의 마크다운 본문으로 합칩니다. */
export function buildShortLessonMarkdown(parts: {
  intro: string;
  core: string;
  closing: string;
}): string {
  const blocks: string[] = [];
  const a = parts.intro.trim();
  const b = parts.core.trim();
  const c = parts.closing.trim();
  if (a) blocks.push(`## 시작하기\n\n${a}`);
  if (b) blocks.push(`## 핵심 정리\n\n${b}`);
  if (c) blocks.push(`## 팁·마무리\n\n${c}`);
  return blocks.join("\n\n");
}
