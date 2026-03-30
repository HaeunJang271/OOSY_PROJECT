import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const POST_REPORTS = "postReports";
const POSTS = "posts";

export const REPORT_TYPES = [
  "스팸/홍보",
  "욕설/비방",
  "음란/선정적",
  "허위 정보",
  "기타",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type PostReport = {
  id: string;
  postId: string;
  reporterId: string;
  reportType: ReportType;
  status: "open" | "resolved";
  createdAt: unknown;
  resolvedAt?: unknown;
  resolvedBy?: string;
};

function mapReport(id: string, data: Record<string, unknown>): PostReport {
  return {
    id,
    postId: String(data.postId ?? ""),
    reporterId: String(data.reporterId ?? ""),
    reportType: (data.reportType as ReportType) ?? "기타",
    status: (data.status as PostReport["status"]) ?? "open",
    createdAt: data.createdAt,
    resolvedAt: data.resolvedAt,
    resolvedBy:
      typeof data.resolvedBy === "string" ? data.resolvedBy : undefined,
  };
}

export async function submitPostReport(input: {
  postId: string;
  reporterId: string;
  reportType: ReportType;
}): Promise<void> {
  const db = getFirebaseDb();
  const postRef = doc(db, POSTS, input.postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) {
    throw new Error("신고할 글을 찾을 수 없습니다.");
  }

  const id = `${input.postId}_${input.reporterId}`;
  const reportRef = doc(db, POST_REPORTS, id);
  await setDoc(reportRef, {
    postId: input.postId,
    reporterId: input.reporterId,
    reportType: input.reportType,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function fetchPostReports(limitCount = 100): Promise<PostReport[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, POST_REPORTS),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReport(d.id, d.data()));
}

export async function fetchMyReportedPostIds(reporterId: string): Promise<Set<string>> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, POST_REPORTS),
    where("reporterId", "==", reporterId),
    where("status", "==", "open"),
  );
  const snap = await getDocs(q);
  return new Set(
    snap.docs
      .map((d) => String((d.data() as { postId?: string }).postId ?? ""))
      .filter(Boolean),
  );
}

export async function isPostReportedByUser(input: {
  postId: string;
  reporterId: string;
}): Promise<boolean> {
  const db = getFirebaseDb();
  const ref = doc(db, POST_REPORTS, `${input.postId}_${input.reporterId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as { status?: string };
  return data.status === "open";
}

export async function resolvePostReport(input: {
  reportId: string;
  resolverId: string;
}): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, POST_REPORTS, input.reportId), {
    status: "resolved",
    resolvedAt: serverTimestamp(),
    resolvedBy: input.resolverId,
  });
}
