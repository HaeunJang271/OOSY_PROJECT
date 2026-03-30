import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const POST_LIKES = "postLikes";
const POST_BOOKMARKS = "postBookmarks";

function likeDocId(postId: string, userId: string): string {
  return `${postId}_${userId}`;
}

function bookmarkDocId(postId: string, userId: string): string {
  return `${postId}_${userId}`;
}

export async function getPostReactionState(input: {
  postId: string;
  userId?: string;
}): Promise<{
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  bookmarkCount: number;
}> {
  const db = getFirebaseDb();
  const [likeCountSnap, bookmarkCountSnap] = await Promise.all([
    getCountFromServer(
      query(collection(db, POST_LIKES), where("postId", "==", input.postId)),
    ),
    getCountFromServer(
      query(collection(db, POST_BOOKMARKS), where("postId", "==", input.postId)),
    ),
  ]);

  if (!input.userId) {
    return {
      liked: false,
      bookmarked: false,
      likeCount: likeCountSnap.data().count,
      bookmarkCount: bookmarkCountSnap.data().count,
    };
  }

  const [likeDoc, bookmarkDoc] = await Promise.all([
    getDoc(doc(db, POST_LIKES, likeDocId(input.postId, input.userId))),
    getDoc(doc(db, POST_BOOKMARKS, bookmarkDocId(input.postId, input.userId))),
  ]);

  return {
    liked: likeDoc.exists(),
    bookmarked: bookmarkDoc.exists(),
    likeCount: likeCountSnap.data().count,
    bookmarkCount: bookmarkCountSnap.data().count,
  };
}

export async function setPostLike(input: {
  postId: string;
  userId: string;
  liked: boolean;
}): Promise<void> {
  const db = getFirebaseDb();
  const id = likeDocId(input.postId, input.userId);
  const ref = doc(db, POST_LIKES, id);
  if (input.liked) {
    await setDoc(ref, {
      postId: input.postId,
      userId: input.userId,
      createdAt: serverTimestamp(),
    });
    return;
  }
  await deleteDoc(ref);
}

export async function setPostBookmark(input: {
  postId: string;
  userId: string;
  bookmarked: boolean;
}): Promise<void> {
  const db = getFirebaseDb();
  const id = bookmarkDocId(input.postId, input.userId);
  const ref = doc(db, POST_BOOKMARKS, id);
  if (input.bookmarked) {
    await setDoc(ref, {
      postId: input.postId,
      userId: input.userId,
      createdAt: serverTimestamp(),
    });
    return;
  }
  await deleteDoc(ref);
}

export async function fetchMyLikedPostIds(userId: string): Promise<string[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, POST_LIKES), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => String((d.data() as { postId?: string }).postId ?? ""))
    .filter(Boolean);
}

export async function fetchMyBookmarkedPostIds(userId: string): Promise<string[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, POST_BOOKMARKS), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => String((d.data() as { postId?: string }).postId ?? ""))
    .filter(Boolean);
}
