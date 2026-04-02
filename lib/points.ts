import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const USERS = "users";

export async function fetchMyPoints(uid: string): Promise<number> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return 0;
  const data = snap.data() as { points?: unknown };
  const n = typeof data.points === "number" ? data.points : Number(data.points);
  return Number.isFinite(n) ? n : 0;
}

