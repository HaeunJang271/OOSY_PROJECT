/** 주제(카테고리) — 예전 글 유형(강좌·질문 등)을 여기로 통합 */
export const POST_CATEGORIES = [
  "공지",
  "강좌",
  "질문",
  "경험담",
  "정보글",
  "교육·진로",
  "복지·지원",
  "자유",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_ALL = "전체" as const;

/** 지역 필터 (전국 + 시·도) */
export const REGIONS = [
  "전국",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_ALL = "전체" as const;
