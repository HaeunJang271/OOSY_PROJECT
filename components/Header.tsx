"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ensureMyPoints, listenMyPoints } from "@/lib/points";

export function Header() {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setPoints(0);
      return;
    }
    void ensureMyPoints(user.uid);
    return listenMyPoints(user.uid, setPoints);
  }, [user?.uid]);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full min-w-0 max-w-2xl grid-cols-3 items-center px-4 py-3">
        <div />
        <div className="flex justify-center">
          <Link href="/" className="text-lg font-semibold text-zinc-950">
            OOSY
          </Link>
        </div>
        <div className="flex justify-end">
          <Link
            href="/points"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            aria-label="포인트 페이지로 이동"
          >
            $ {loading ? "…" : `${points}P`}
          </Link>
        </div>
      </div>
    </header>
  );
}
