import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Post, PostStatus } from "@/lib/types";
import { CATEGORY_ALL } from "@/lib/constants";
import { getFirebaseDb } from "@/lib/firebase";

const POSTS = "posts";

function mapPost(id: string, data: Record<string, unknown>): Post {
  return {
    id,
    title: String(data.title ?? ""),
    content: String(data.content ?? ""),
    category: String(data.category ?? ""),
    authorId: String(data.authorId ?? ""),
    createdAt: data.createdAt as Post["createdAt"],
    status: (data.status as PostStatus) ?? "pending",
  };
}

export async function fetchApprovedPosts(category?: string): Promise<Post[]> {
  const db = getFirebaseDb();
  const postsRef = collection(db, POSTS);
  const statusApproved = where("status", "==", "approved" as PostStatus);
  const q =
    category && category !== CATEGORY_ALL
      ? query(
          postsRef,
          statusApproved,
          where("category", "==", category),
          orderBy("createdAt", "desc"),
        )
      : query(postsRef, statusApproved, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPost(d.id, d.data()));
}

export async function fetchPendingPosts(): Promise<Post[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, POSTS),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPost(d.id, d.data()));
}

/** 관리자: 최근 승인 글만 (카테고리 필터 없음) */
export async function fetchApprovedRecent(limitCount: number): Promise<Post[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, POSTS),
    where("status", "==", "approved" as PostStatus),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPost(d.id, d.data()));
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const db = getFirebaseDb();
  const ref = doc(db, POSTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapPost(snap.id, snap.data() as Record<string, unknown>);
}

export async function createPost(input: {
  title: string;
  content: string;
  category: string;
  authorId: string;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, POSTS), {
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category,
    authorId: input.authorId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setPostStatus(postId: string, status: PostStatus): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, POSTS, postId), { status });
}

const COMMENTS = "comments";

/** 관리자: 글 + 해당 글의 댓글 일괄 삭제 */
export async function deletePostAsAdmin(postId: string): Promise<void> {
  const db = getFirebaseDb();
  const commentsSnap = await getDocs(
    query(collection(db, COMMENTS), where("postId", "==", postId)),
  );
  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, POSTS, postId));
  await batch.commit();
}
