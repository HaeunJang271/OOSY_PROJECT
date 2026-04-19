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
      <header
        className="relative z-10 border-b border-white/10"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "saturate(180%) blur(20px)" }}
      >
        <div className="mx-auto grid w-full min-w-0 max-w-2xl grid-cols-3 items-center px-4 h-12">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
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
              OOSY
            </Link>
          </div>

          <div className="flex justify-end">
            {user && (
              <Link
                href="/points"
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white border border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                aria-label="포인트 페이지로 이동"
              >
                {loading ? "…" : `${points}P`}
              </Link>
            )}
            {!user && !loading && (
              <Link
                href="/login"
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#0071e3] text-white hover:bg-[#0077ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
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
