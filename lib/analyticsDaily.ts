import { doc, getDoc, runTransaction } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const ANALYTICS_DAILY = "analyticsDaily";
const ANALYTICS_TOTALS = "analyticsTotals";

function yyyyMmDd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function logDailyVisit(userId: string): Promise<void> {
  const db = getFirebaseDb();
  const dayId = yyyyMmDd();
  const dayRef = doc(db, ANALYTICS_DAILY, dayId);
  const dedupeRef = doc(db, ANALYTICS_DAILY, `${dayId}_${userId}`);
  const totalRef = doc(db, ANALYTICS_TOTALS, "visits");

  await runTransaction(db, async (tx) => {
    const d = await tx.get(dedupeRef);
    if (d.exists()) return;
    const snap = await tx.get(dayRef);
    const current =
      snap.exists() && typeof (snap.data() as { visits?: unknown }).visits === "number"
        ? ((snap.data() as { visits?: number }).visits ?? 0)
        : 0;
    const totalSnap = await tx.get(totalRef);
    const totalCurrent =
      totalSnap.exists() && typeof (totalSnap.data() as { count?: unknown }).count === "number"
        ? ((totalSnap.data() as { count?: number }).count ?? 0)
        : 0;
    tx.set(dayRef, { visits: current + 1, updatedAt: new Date() }, { merge: true });
    tx.set(dedupeRef, { userId, createdAt: new Date() }, { merge: false });
    tx.set(totalRef, { count: totalCurrent + 1, updatedAt: new Date() }, { merge: true });
  });
}

