"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full min-w-0 max-w-2xl items-center justify-center px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-950">
          OOSY
        </Link>
      </div>
    </header>
  );
}
