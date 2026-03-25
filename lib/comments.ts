import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { Comment } from "@/lib/types";
import { getFirebaseDb } from "@/lib/firebase";

const COMMENTS = "comments";

function mapComment(id: string, data: Record<string, unknown>): Comment {
  return {
    id,
    postId: String(data.postId ?? ""),
    content: String(data.content ?? ""),
    authorId: String(data.authorId ?? ""),
    createdAt: data.createdAt as Comment["createdAt"],
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
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, COMMENTS), {
    postId: input.postId,
    content: input.content.trim(),
    authorId: input.authorId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
