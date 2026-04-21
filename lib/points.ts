import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const USERS = "users";
export const DEFAULT_POINTS = 5;

export async function fetchMyPoints(uid: string): Promise<number> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return 0;
  const data = snap.data() as { points?: unknown };
  const n = typeof data.points === "number" ? data.points : Number(data.points);
  return Number.isFinite(n) ? n : 0;
}

/** points가 없으면 기본값(5P) 세팅. 실제로 세팅했으면 true */
export async function ensureMyPoints(uid: string): Promise<boolean> {
  const db = getFirebaseDb();
  const ref = doc(db, USERS, uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { points: DEFAULT_POINTS }, { merge: true });
      return true;
    }
    const data = snap.data() as { points?: unknown };
    if (typeof data.points === "number") return false;
    tx.set(ref, { points: DEFAULT_POINTS }, { merge: true });
    return true;
  });
}

export function listenMyPoints(uid: string, onValue: (points: number) => void): Unsubscribe {
  const db = getFirebaseDb();
  const ref = doc(db, USERS, uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onValue(0);
        return;
      }
      const data = snap.data() as { points?: unknown };
      const n = typeof data.points === "number" ? data.points : Number(data.points);
      onValue(Number.isFinite(n) ? n : 0);
    },
    () => {
      onValue(0);
    },
  );
}

