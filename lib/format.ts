import type { Timestamp } from "firebase/firestore";

export function formatDate(value: Timestamp | Date | unknown): string {
  if (!value) return "";
  let d: Date;
  if (typeof (value as Timestamp)?.toDate === "function") {
    d = (value as Timestamp).toDate();
  } else if (value instanceof Date) {
    d = value;
  } else {
    return "";
  }
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortUid(uid: string): string {
  if (!uid) return "";
  return uid.length <= 8 ? uid : `${uid.slice(0, 6)}…`;
}
