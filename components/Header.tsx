"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

const nav = [
  { href: "/", label: "홈" },
  { href: "/write", label: "글쓰기" },
  { href: "/login", label: "로그인" },
];

export function Header() {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();

  async function handleLogout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-950">
          OOSY
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {nav.map(({ href, label }) => {
            if (href === "/login" && user) return null;
            if (href === "/write" && !user) return null;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 ${
                  active
                    ? "bg-zinc-900 text-[#ffffff]"
                    : "text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-full px-3 py-1.5 ${
                pathname === "/admin"
                  ? "bg-amber-600 text-[#ffffff]"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              관리
            </Link>
          )}
          {!loading && user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-1.5 text-zinc-800 hover:bg-zinc-100"
            >
              로그아웃
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
