"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ensureMyPoints, listenMyPoints } from "@/lib/points";
import { submitRewardRequest, type RewardKey } from "@/lib/rewardRequests";

export default function PointsPage() {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState(false);
  const uid = user?.uid ?? null;
  const [toast, setToast] = useState<string | null>(null);

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

  const userId = user.uid;

  async function requestReward(input: {
    rewardKey: RewardKey;
    rewardName: string;
    costPoints: number;
  }) {
    if (pointsLoading) return;
    if (points < input.costPoints) {
      alert("포인트가 부족합니다.");
      return;
    }
    const ok = confirm(
      "현재 보상은 관리자가 확인 후 수동으로 지급합니다. 신청하시겠습니까?",
    );
    if (!ok) return;
    const phone = window.prompt("전화번호를 입력해 주세요. (예: 010-1234-5678)");
    const cleaned = (phone ?? "").trim();
    if (!cleaned) return;
    const only = cleaned.replace(/\s/g, "");
    const valid =
      /^01[0-9]-?\d{3,4}-?\d{4}$/.test(only) || /^\d{9,12}$/.test(only);
    if (!valid) {
      alert("전화번호 형식이 올바르지 않습니다.");
      return;
    }
    try {
      await submitRewardRequest({
        userId,
        phone: only,
        rewardKey: input.rewardKey,
        rewardName: input.rewardName,
        costPoints: input.costPoints,
      });
      setToast(`신청이 접수되었습니다: ${input.rewardName}`);
      window.setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error(e);
      alert("신청 접수에 실패했습니다.");
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold text-neutral-950">포인트</h1>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium text-neutral-500">현재 포인트</p>
        <p className="mt-1 text-2xl font-bold text-neutral-950">
          $ {pointsLoading ? "…" : `${points}P`}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-950">보상</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
{ rewardKey: "gift_1000" as const, title: "편의점 상품권 1000원", costPoints: 10, sub: "10P" },
            { rewardKey: "gift_2000" as const, title: "편의점 상품권 2000원", costPoints: 20, sub: "20P" },
            { rewardKey: "gift_5000" as const, title: "편의점 상품권 5000원", costPoints: 50, sub: "50P" },
            { rewardKey: "gift_10000" as const, title: "편의점 상품권 10000원", costPoints: 100, sub: "100P" },
          ].map((r) => (
            <button
              key={`${r.title}-${r.sub}`}
              type="button"
              onClick={() =>
                void requestReward({
                  rewardKey: r.rewardKey,
                  rewardName: r.title,
                  costPoints: r.costPoints,
                })
              }
              className="aspect-square w-full rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-zinc-50"
            >
              <p className="text-sm font-semibold text-neutral-950">{r.title}</p>
              {r.sub ? (
                <p className="mt-1 text-xs font-medium text-neutral-600">
                  {r.sub}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </section>
      {toast && (
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

