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
import { CATEGORY_ALL, REGION_ALL, REGIONS } from "@/lib/constants";
import { getFirebaseDb } from "@/lib/firebase";

const POSTS = "posts";

function mapPost(id: string, data: Record<string, unknown>): Post {
  return {
    id,
    title: String(data.title ?? ""),
    content: String(data.content ?? ""),
    category: String(data.category ?? ""),
    region: String(data.region ?? "전국"),
    authorId: String(data.authorId ?? ""),
    createdAt: data.createdAt as Post["createdAt"],
    updatedAt: data.updatedAt as Post["updatedAt"],
    status: (data.status as PostStatus) ?? "pending",
    commentsEnabled:
      typeof data.commentsEnabled === "boolean"
        ? data.commentsEnabled
        : undefined,
  };
}

const APPROVED_FETCH_LIMIT = 400;

export type ApprovedPostFilters = {
  category?: string;
  region?: string;
};

export async function fetchApprovedPosts(
  filters: ApprovedPostFilters = {},
): Promise<Post[]> {
  const db = getFirebaseDb();
  const postsRef = collection(db, POSTS);
  const statusApproved = where("status", "==", "approved" as PostStatus);

  const category =
    filters.category && filters.category !== CATEGORY_ALL
      ? filters.category
      : undefined;
  // 홈의 지역 필터는 "전국"을 전체 보기로 취급합니다.
  const REGION_HOME_ALL = REGIONS[0];
  const region =
    filters.region &&
    filters.region !== REGION_ALL &&
    filters.region !== REGION_HOME_ALL
      ? filters.region
      : undefined;

  const onlyCategory = Boolean(category) && !region;

  if (onlyCategory) {
    const q = query(
      postsRef,
      statusApproved,
      where("category", "==", category),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapPost(d.id, d.data()));
  }

  const q = query(
    postsRef,
    statusApproved,
    orderBy("createdAt", "desc"),
    limit(APPROVED_FETCH_LIMIT),
  );
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => mapPost(d.id, d.data()));
  if (category) {
    list = list.filter((p) => p.category === category);
  }
  if (region) {
    list = list.filter((p) => p.region === region);
  }
  return list;
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

/** 내가 작성한 승인 대기 글 (마이페이지) */
export async function fetchMyPendingPosts(authorId: string): Promise<Post[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, POSTS),
    where("authorId", "==", authorId),
    where("status", "==", "pending" as PostStatus),
    orderBy("createdAt", "desc"),
    limit(50),
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

/** 승인 대기(pending) 글 — 작성자만 수정 가능 (Firestore 규칙과 함께 사용) */
export async function updatePendingPost(input: {
  postId: string;
  title: string;
  content: string;
  category: string;
  region: string;
  authorId: string;
  commentsEnabled: boolean;
}): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, POSTS, input.postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("글을 찾을 수 없습니다.");
  }
  const data = snap.data() as Record<string, unknown>;
  if (String(data.authorId ?? "") !== input.authorId) {
    throw new Error("이 글을 수정할 권한이 없습니다.");
  }
  if ((data.status as PostStatus) !== "pending") {
    throw new Error("승인 대기 중인 글만 수정할 수 있습니다.");
  }
  await updateDoc(ref, {
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category,
    region: input.region,
    commentsEnabled: Boolean(input.commentsEnabled),
    updatedAt: serverTimestamp(),
  });
}

export async function createPost(input: {
  title: string;
  content: string;
  category: string;
  region: string;
  authorId: string;
  commentsEnabled: boolean;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, POSTS), {
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category,
    region: input.region,
    authorId: input.authorId,
    status: "pending",
    createdAt: serverTimestamp(),
    commentsEnabled: Boolean(input.commentsEnabled),
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

/** 작성자: 글(승인 여부 무관) + 해당 글 댓글 일괄 삭제 */
export async function deletePostByAuthor(input: {
  postId: string;
  authorId: string;
}): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, POSTS, input.postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("글을 찾을 수 없습니다.");
  }
  const data = snap.data() as Record<string, unknown>;
  if (String(data.authorId ?? "") !== input.authorId) {
    throw new Error("이 글을 삭제할 권한이 없습니다.");
  }
  const commentsSnap = await getDocs(
    query(collection(db, COMMENTS), where("postId", "==", input.postId)),
  );
  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();
}
