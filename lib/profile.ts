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

/**
 * 학밖청_ · 전문가_ + 접미사 2~3자 (한글·영문·숫자)
 * 관리자_ 형식은 운영 관리자( Firestore admins )만 사용 가능 — validateNickname(isAdmin) 참고
 */
export const CANONICAL_NICKNAME_REGEX =
  /^학밖청_[가-힣A-Za-z0-9]{2,3}$|^전문가_[가-힣A-Za-z0-9]{2,3}$|^관리자_[가-힣A-Za-z0-9]{2,3}$/;

const NICK_YOUTH = /^학밖청_[가-힣A-Za-z0-9]{2,3}$/;
const NICK_EXPERT = /^전문가_[가-힣A-Za-z0-9]{2,3}$/;
const NICK_ADMIN = /^관리자_[가-힣A-Za-z0-9]{2,3}$/;

export type NicknameRole = "youth" | "expert" | "admin";

const PREFIX_YOUTH = "학밖청_";
const PREFIX_EXPERT = "전문가_";
const PREFIX_ADMIN = "관리자_";

/** 닉네임 접미(음절 2개 = 문자열 length 2) — 짧은 단어에서 무작위 선택 */
const NICK_WORDS_2 = [
  "바다", "파도", "노을", "구름", "바람", "새벽", "하늘", "별빛", "햇살", "이슬", "새싹", "풀잎",
  "마음", "아침", "저녁", "소리", "은하", "꽃잎", "물결", "모래", "돌담", "초록", "봄날", "가을",
  "겨울", "여름", "달빛", "숲길", "꿈결", "별무", "푸름", "섬빛", "해답", "산길", "강물",
] as const;

/** 닉네임 접미(음절 3개 = 문자열 length 3) */
const NICK_WORDS_3 = [
  "무지개", "은하수", "푸른빛", "노을빛", "별무리", "새벽빛", "바다빛", "숲속길",
  "꿈나무", "구름길", "바람결", "별자리", "꽃향기", "새소리", "물안개", "푸른숲",
  "아침별", "저녁별", "한줄기", "고요함", "파도빛", "숲바람", "별빛길", "새벽길",
] as const;

function randomSuffix(): string {
  const useThree = Math.random() < 0.5;
  const pool = useThree ? NICK_WORDS_3 : NICK_WORDS_2;
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

export function suggestNickname(role: NicknameRole): string {
  const suf = randomSuffix();
  if (role === "youth") return `${PREFIX_YOUTH}${suf}`;
  if (role === "expert") return `${PREFIX_EXPERT}${suf}`;
  return `${PREFIX_ADMIN}${suf}`;
}

export function nicknameRoleFromValue(nickname: string): NicknameRole | null {
  const t = nickname.trim();
  if (t.startsWith(PREFIX_ADMIN)) return "admin";
  if (t.startsWith(PREFIX_EXPERT)) return "expert";
  if (t.startsWith(PREFIX_YOUTH)) return "youth";
  return null;
}

export function isCanonicalNicknameFormat(nickname: string): boolean {
  return CANONICAL_NICKNAME_REGEX.test(nickname.trim());
}

/**
 * @param isAdmin Firestore `admins/{uid}` 문서 존재 여부
 */
export function validateNickname(nickname: string, isAdmin = false): string | null {
  const t = nickname.trim();
  if (!t) return "닉네임을 입력해 주세요.";
  if (NICK_ADMIN.test(t)) {
    if (!isAdmin) {
      return "관리자_ 닉네임은 운영 관리자 권한이 있는 계정만 사용할 수 있습니다.";
    }
    return null;
  }
  if (NICK_YOUTH.test(t) || NICK_EXPERT.test(t)) {
    return null;
  }
  return "닉네임은 학밖청_ 또는 전문가_ 뒤에 2~3자(한글·영문·숫자)를 붙인 형식이어야 합니다. (운영 관리자는 관리자_ 형식도 가능)";
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserProfile>;
  return {
    uid,
    nickname: typeof data.nickname === "string" ? data.nickname : undefined,
    points: typeof data.points === "number" ? data.points : undefined,
  };
}

export async function fetchNicknamesByUids(
  uids: string[],
): Promise<Record<string, string>> {
  const uniq = [...new Set(uids.map((v) => v.trim()).filter(Boolean))];
  if (uniq.length === 0) return {};

  const db = getFirebaseDb();
  const result: Record<string, string> = {};

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
  /** Firestore admins 문서 존재 여부 — 관리자_ 닉네임 검증에 사용 */
  isAdmin?: boolean;
  db?: Firestore;
}): Promise<void> {
  const db = params.db ?? getFirebaseDb();
  const nickname = params.nickname.trim();

  await runTransaction(db, async (tx) => {
    const nickRef = doc(db, "nicknames", nickname);
    const userRef = doc(db, "users", params.uid);
    const userSnap = await tx.get(userRef);
    const oldNickname =
      userSnap.exists() && typeof (userSnap.data() as { nickname?: unknown }).nickname === "string"
        ? ((userSnap.data() as { nickname?: string }).nickname ?? "").trim()
        : "";

    const validationError = validateNickname(nickname, Boolean(params.isAdmin));
    if (validationError) {
      throw new Error(validationError);
    }

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
        points:
          userSnap.exists() && typeof (userSnap.data() as { points?: unknown }).points === "number"
            ? ((userSnap.data() as { points?: number }).points ?? 10)
            : 10,
        createdAt: userSnap.exists()
          ? (userSnap.data() as { createdAt?: unknown }).createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}
