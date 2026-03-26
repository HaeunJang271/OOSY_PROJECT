import type { Timestamp } from "firebase/firestore";

export type PostStatus = "pending" | "approved";

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  createdAt: Timestamp | Date;
  status: PostStatus;
  commentsEnabled?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  createdAt: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  nickname?: string;
}
