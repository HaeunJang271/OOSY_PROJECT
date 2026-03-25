/** 강좌·정보 글 카테고리 (MVP 고정값) */
export const POST_CATEGORIES = [
  "정보",
  "교육·진로",
  "복지·지원",
  "상담·질문",
  "자유",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_ALL = "전체" as const;
