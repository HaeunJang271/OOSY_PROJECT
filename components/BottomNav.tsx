"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  type Item = { href: string; label: string; active: boolean };

  const items: Item[] = [
    {
      href: "/",
      label: "홈",
      active: pathname === "/",
    },
    {
      href: "/write",
      label: "글쓰기",
      active: pathname === "/write",
    },
  ];

  if (isAdmin) {
    items.push({
      href: "/admin",
      label: "관리",
      active: pathname === "/admin" || pathname.startsWith("/admin/"),
    });
  }

  items.push({
    href: "/mypage",
    label: "마이페이지",
    active: pathname === "/mypage",
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
      aria-label="하단 메뉴"
    >
      <ul className="mx-auto flex w-full min-w-0 max-w-2xl items-stretch justify-around">
        {items.map(({ href, label, active }) => (
          <li key={href} className="min-w-0 flex-1 border-r border-zinc-200 last:border-r-0">
            <Link
              href={href}
              className={`block px-2 py-3 text-center text-xs font-medium ${
                active
                  ? "bg-zinc-900 text-[#ffffff]"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
