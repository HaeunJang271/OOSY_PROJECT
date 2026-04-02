"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ensureMyPoints, listenMyPoints } from "@/lib/points";
import { HeaderSearchPanel } from "@/components/HeaderSearchPanel";

export function Header() {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    if (!user) {
      setPoints(0);
      return;
    }
    void ensureMyPoints(user.uid);
    return listenMyPoints(user.uid, setPoints);
  }, [user?.uid]);

  return (
    <div className="sticky top-0 z-30">
      <header className="relative z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid w-full min-w-0 max-w-2xl grid-cols-3 items-center px-4 py-3">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
              aria-label={searchOpen ? "검색 닫기" : "검색 열기"}
            >
              {searchOpen ? (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              )}
            </button>
          </div>
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
      <HeaderSearchPanel open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
