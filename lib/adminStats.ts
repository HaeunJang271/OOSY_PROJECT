import {
  collection,
  getCountFromServer,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { POST_CATEGORIES } from "@/lib/constants";

const USERS = "users";
const POSTS = "posts";
const COMMENTS = "comments";
const ANALYTICS_DAILY = "analyticsDaily";
const ANALYTICS_TOTALS = "analyticsTotals";

export type AdminStats = {
  userCount: number;
  postCount: number;
  questionCount: number;
  categoryCounts: Record<string, number>;
  todayVisits: number;
  avgDailyVisits30d: number;
  totalVisits: number;
};

function yyyyMmDd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const db = getFirebaseDb();

  const [usersSnap, postsSnap, questionsSnap] = await Promise.all([
    getCountFromServer(query(collection(db, USERS))),
    getCountFromServer(query(collection(db, POSTS))),
    getCountFromServer(
      query(
        collection(db, COMMENTS),
        where("parentId", "==", null),
      ),
    ),
  ]);

  const categoryEntries = await Promise.all(
    POST_CATEGORIES.map(async (c) => {
      const snap = await getCountFromServer(
        query(collection(db, POSTS), where("category", "==", c)),
      );
      return [c, snap.data().count] as const;
    }),
  );

  const todayRef = doc(db, ANALYTICS_DAILY, yyyyMmDd());
  const todaySnap = await getDoc(todayRef);
  const todayVisits =
    todaySnap.exists() && typeof (todaySnap.data() as { visits?: unknown }).visits === "number"
      ? ((todaySnap.data() as { visits?: number }).visits ?? 0)
      : 0;

  // 최근 30일 일 평균 방문(없는 날은 0으로 계산)
  const today = new Date();
  const last30Ids = Array.from({ length: 30 }, (_, i) =>
    yyyyMmDd(addDays(today, -(29 - i))),
  );
  const last30Snaps = await Promise.all(
    last30Ids.map((id) => getDoc(doc(db, ANALYTICS_DAILY, id))),
  );
  const sum30 = last30Snaps.reduce((acc, s) => {
    if (!s.exists()) return acc;
    const v = (s.data() as { visits?: unknown }).visits;
    return acc + (typeof v === "number" ? v : Number(v ?? 0));
  }, 0);
  const avgDailyVisits30d = Math.round((sum30 / 30) * 10) / 10;

  const totalRef = doc(db, ANALYTICS_TOTALS, "visits");
  const totalSnap = await getDoc(totalRef);
  const totalVisits =
    totalSnap.exists() && typeof (totalSnap.data() as { count?: unknown }).count === "number"
      ? ((totalSnap.data() as { count?: number }).count ?? 0)
      : 0;

  return {
    userCount: usersSnap.data().count,
    postCount: postsSnap.data().count,
    questionCount: questionsSnap.data().count,
    categoryCounts: Object.fromEntries(categoryEntries),
    todayVisits,
    avgDailyVisits30d,
    totalVisits,
  };
}

