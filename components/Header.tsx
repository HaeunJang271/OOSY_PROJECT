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
      <header className="relative z-10 nav-glass-dark">
        <div className="mx-auto grid h-12 w-full min-w-0 max-w-2xl grid-cols-3 items-center px-5">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="btn-icon-dark h-8 w-8 focus-ring"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
              aria-label={searchOpen ? "검색 닫기" : "검색 열기"}
            >
              {searchOpen ? (
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="text-base font-semibold text-white tracking-tight">
              이으리
            </Link>
          </div>

          <div className="flex justify-end">
            {user && (
              <Link
                href="/points"
                className="btn-pill-dark focus-ring"
                aria-label="포인트 페이지로 이동"
              >
                {loading ? "…" : `${points}P`}
              </Link>
            )}
            {!user && !loading && (
              <Link
                href="/login"
                className="btn-accent focus-ring"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>
      <HeaderSearchPanel open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
