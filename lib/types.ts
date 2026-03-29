import type { Timestamp } from "firebase/firestore";

export type PostStatus = "pending" | "approved";

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  /** 시·도 또는 전국 */
  region: string;
  authorId: string;
  createdAt: Timestamp | Date;
  /** 수정 시 갱신 */
  updatedAt?: Timestamp | Date;
  status: PostStatus;
  commentsEnabled?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  /** null·없음 = 최상위 질문/글 스레드 */
  parentId?: string | null;
}

export interface UserProfile {
  uid: string;
  nickname?: string;
}
