import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Comment } from "@/lib/types";
import { timestampMs } from "@/lib/format";
import { getFirebaseDb } from "@/lib/firebase";

const COMMENTS = "comments";

function mapComment(id: string, data: Record<string, unknown>): Comment {
  return {
    id,
    postId: String(data.postId ?? ""),
    content: String(data.content ?? ""),
    authorId: String(data.authorId ?? ""),
    createdAt: data.createdAt as Comment["createdAt"],
    parentId: typeof data.parentId === "string" ? data.parentId : null,
  };
}

export async function fetchCommentsForPost(postId: string): Promise<Comment[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COMMENTS),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapComment(d.id, d.data()));
}

export async function addComment(input: {
  postId: string;
  content: string;
  authorId: string;
  parentId: string | null;
}): Promise<string> {
  const db = getFirebaseDb();
  if (input.parentId) {
    const parentRef = doc(db, COMMENTS, input.parentId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) {
      throw new Error("답글 대상을 찾을 수 없습니다.");
    }
    const pd = parentSnap.data() as { postId?: string };
    if (pd.postId !== input.postId) {
      throw new Error("같은 글 안에서만 답글을 달 수 있습니다.");
    }
  }
  const ref = await addDoc(collection(db, COMMENTS), {
    postId: input.postId,
    content: input.content.trim(),
    authorId: input.authorId,
    parentId: input.parentId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

function collectSubtreeIds(
  rootId: string,
  comments: Comment[],
): string[] {
  const childrenByParent = new Map<string | null, Comment[]>();
  for (const c of comments) {
    const p = c.parentId ?? null;
    const list = childrenByParent.get(p) ?? [];
    list.push(c);
    childrenByParent.set(p, list);
  }
  for (const [, list] of childrenByParent) {
    list.sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt));
  }
  const out: string[] = [];
  function walk(id: string) {
    out.push(id);
    const ch = childrenByParent.get(id) ?? [];
    for (const child of ch) {
      walk(child.id);
    }
  }
  walk(rootId);
  return out;
}

/** 관리자: 해당 댓글과 하위 답글을 모두 삭제 */
export async function deleteCommentTree(
  commentId: string,
  postId: string,
): Promise<void> {
  const all = await fetchCommentsForPost(postId);
  const ids = collectSubtreeIds(commentId, all);
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(doc(db, COMMENTS, id));
  }
  await batch.commit();
}

export async function deleteComment(commentId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COMMENTS, commentId));
}
