"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  documentId,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

export const NICKNAME_REGEX = /^[A-Za-z0-9가-힣_ ]{2,12}$/;

export function validateNickname(nickname: string, isAdmin = false): string | null {
  const t = nickname.trim();
  if (!t) return "닉네임을 입력해 주세요.";
  if (!NICKNAME_REGEX.test(t)) {
    return "닉네임은 2~12자, 한글/영문/숫자/언더바(_)/공백만 사용할 수 있습니다.";
  }
  if (!isAdmin && t.includes("관리자")) {
    return "일반 사용자는 닉네임에 '관리자'를 포함할 수 없습니다.";
  }
  return null;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserProfile>;
  return {
    uid,
    nickname: typeof data.nickname === "string" ? data.nickname : undefined,
  };
}

export async function fetchNicknamesByUids(
  uids: string[],
): Promise<Record<string, string>> {
  const uniq = [...new Set(uids.map((v) => v.trim()).filter(Boolean))];
  if (uniq.length === 0) return {};

  const db = getFirebaseDb();
  const result: Record<string, string> = {};

  // Firestore "in" 쿼리는 최대 10개씩만 허용
  for (let i = 0; i < uniq.length; i += 10) {
    const chunk = uniq.slice(i, i + 10);
    const q = query(
      collection(db, "users"),
      where(documentId(), "in", chunk),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as { nickname?: unknown };
      if (typeof data.nickname === "string" && data.nickname.trim()) {
        result[d.id] = data.nickname;
      }
    });
  }

  return result;
}

export async function setNickname(params: {
  uid: string;
  nickname: string;
  isAdmin?: boolean;
  db?: Firestore;
}): Promise<void> {
  const db = params.db ?? getFirebaseDb();
  const nickname = params.nickname.trim();
  const validationError = validateNickname(nickname, Boolean(params.isAdmin));
  if (validationError) {
    throw new Error(validationError);
  }

  await runTransaction(db, async (tx) => {
    const nickRef = doc(db, "nicknames", nickname);
    const userRef = doc(db, "users", params.uid);
    const userSnap = await tx.get(userRef);
    const oldNickname =
      userSnap.exists() && typeof (userSnap.data() as { nickname?: unknown }).nickname === "string"
        ? ((userSnap.data() as { nickname?: string }).nickname ?? "").trim()
        : "";

    const nickSnap = await tx.get(nickRef);
    if (nickSnap.exists()) {
      const owner = (nickSnap.data() as { uid?: unknown }).uid;
      if (owner !== params.uid) {
        throw new Error("이미 사용 중인 닉네임입니다.");
      }
    }

    if (oldNickname === nickname) {
      tx.set(
        userRef,
        {
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    if (!nickSnap.exists()) {
      tx.set(nickRef, { uid: params.uid, createdAt: serverTimestamp() });
    }

    if (oldNickname) {
      const oldRef = doc(db, "nicknames", oldNickname);
      const oldSnap = await tx.get(oldRef);
      if (oldSnap.exists()) {
        const oldOwner = (oldSnap.data() as { uid?: unknown }).uid;
        if (oldOwner === params.uid) {
          tx.delete(oldRef);
        }
      }
    }

    tx.set(
      userRef,
      {
        nickname,
        createdAt: userSnap.exists()
          ? (userSnap.data() as { createdAt?: unknown }).createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

