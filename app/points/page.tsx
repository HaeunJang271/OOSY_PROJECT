"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ensureMyPoints, listenMyPoints } from "@/lib/points";

export default function PointsPage() {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState(false);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setPoints(0);
      setPointsLoading(false);
      return;
    }
    setPointsLoading(true);
    void ensureMyPoints(uid).finally(() => setPointsLoading(false));
    return listenMyPoints(uid, setPoints);
  }, [uid]);

  if (loading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm text-neutral-700">불러오는 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-2 text-xl font-semibold text-neutral-950">포인트</h1>
        <p className="mb-6 text-sm text-neutral-800">
          포인트를 확인하려면 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-[#ffffff]"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold text-neutral-950">포인트</h1>
      <p className="text-sm text-neutral-800">
        아직 포인트 적립/사용 기능은 준비 중입니다.
      </p>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-neutral-500">현재 포인트</p>
        <p className="mt-1 text-2xl font-bold text-neutral-950">
          $ {pointsLoading ? "…" : `${points}P`}
        </p>
      </div>
    </div>
  );
}

