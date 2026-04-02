import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { timestampMs } from "@/lib/format";

const REWARD_REQUESTS = "rewardRequests";
const USERS = "users";

export type RewardKey =
  | "chupa"
  | "gift_1000"
  | "gift_2000"
  | "gift_5000"
  | "gift_10000";

export type RewardRequestStatus = "open" | "fulfilled";

export type RewardRequest = {
  id: string;
  userId: string;
  phone: string;
  rewardKey: RewardKey;
  rewardName: string;
  costPoints: number;
  status: RewardRequestStatus;
  createdAt: unknown;
  fulfilledAt?: unknown;
  fulfilledBy?: string;
};

function mapRewardRequest(id: string, data: Record<string, unknown>): RewardRequest {
  return {
    id,
    userId: String(data.userId ?? ""),
    phone: String(data.phone ?? ""),
    rewardKey: String(data.rewardKey ?? "") as RewardKey,
    rewardName: String(data.rewardName ?? ""),
    costPoints: typeof data.costPoints === "number" ? data.costPoints : Number(data.costPoints ?? 0),
    status: (data.status as RewardRequestStatus) ?? "open",
    createdAt: data.createdAt,
    fulfilledAt: data.fulfilledAt,
    fulfilledBy: typeof data.fulfilledBy === "string" ? data.fulfilledBy : undefined,
  };
}

export async function submitRewardRequest(input: {
  userId: string;
  phone: string;
  rewardKey: RewardKey;
  rewardName: string;
  costPoints: number;
}): Promise<void> {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS, input.userId);
  const reqRef = doc(collection(db, REWARD_REQUESTS));

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const current =
      userSnap.exists() && typeof (userSnap.data() as { points?: unknown }).points === "number"
        ? ((userSnap.data() as { points?: number }).points ?? 0)
        : 0;
    if (current < input.costPoints) {
      throw new Error("포인트가 부족합니다.");
    }
    tx.set(
      reqRef,
      {
        userId: input.userId,
        phone: input.phone,
        rewardKey: input.rewardKey,
        rewardName: input.rewardName,
        costPoints: input.costPoints,
        status: "open",
        createdAt: serverTimestamp(),
      },
      { merge: false },
    );
    tx.set(
      userRef,
      { points: current - input.costPoints },
      { merge: true },
    );
  });
}

export async function fetchOpenRewardRequests(limitCount = 100): Promise<RewardRequest[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, REWARD_REQUESTS),
    where("status", "==", "open"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapRewardRequest(d.id, d.data()))
    .sort((a, b) => timestampMs(b.createdAt as never) - timestampMs(a.createdAt as never));
}

export async function fulfillRewardRequest(input: {
  requestId: string;
  adminId: string;
}): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, REWARD_REQUESTS, input.requestId), {
    status: "fulfilled",
    fulfilledAt: serverTimestamp(),
    fulfilledBy: input.adminId,
  });
}

