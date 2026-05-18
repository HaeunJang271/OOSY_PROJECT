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
      <div className="page-shell">
        <p className="text-sm text-muted">불러오는 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">포인트</h1>
          <p className="page-lead">포인트를 확인하려면 로그인해 주세요.</p>
        </div>
        <Link href="/login" className="btn-primary inline-flex w-auto px-5">
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
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">포인트</h1>
        <p className="page-lead">활동으로 쌓은 포인트로 보상을 신청할 수 있습니다.</p>
      </div>
      <div className="surface-card-pad">
        <p className="stat-label">현재 포인트</p>
        <p className="stat-value">{pointsLoading ? "…" : `${points}P`}</p>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-foreground">보상</h2>
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
              className="surface-card aspect-square w-full p-4 text-left transition-colors duration-150 hover:bg-[color:var(--surface-muted)]"
            >
              <p className="text-sm font-semibold text-foreground">{r.title}</p>
              {r.sub ? <p className="mt-1 text-meta">{r.sub}</p> : null}
            </button>
          ))}
        </div>
      </section>
      {toast && (
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto w-full max-w-2xl px-5">
          <div className="surface-card px-4 py-3 text-sm text-foreground">{toast}</div>
        </div>
      )}
    </div>
  );
}
