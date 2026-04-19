"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "#0071e3" : "none"} stroke={active ? "#0071e3" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconWrite({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={active ? "#0071e3" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconAdmin({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={active ? "#0071e3" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconPerson({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={active ? "#0071e3" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  type Item = { href: string; label: string; active: boolean; icon: React.ReactNode };

  const items: Item[] = [
    {
      href: "/",
      label: "홈",
      active: pathname === "/",
      icon: <IconHome active={pathname === "/"} />,
    },
    {
      href: "/write",
      label: "글쓰기",
      active: pathname === "/write",
      icon: <IconWrite active={pathname === "/write"} />,
    },
  ];

  if (isAdmin) {
    items.push({
      href: "/admin",
      label: "관리",
      active: pathname === "/admin" || pathname.startsWith("/admin/"),
      icon: <IconAdmin active={pathname === "/admin" || pathname.startsWith("/admin/")} />,
    });
  }

  items.push({
    href: "/mypage",
    label: "마이페이지",
    active: pathname === "/mypage",
    icon: <IconPerson active={pathname === "/mypage"} />,
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/[0.08] pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "saturate(180%) blur(20px)" }}
      aria-label="하단 메뉴"
    >
      <ul className="mx-auto flex w-full min-w-0 max-w-2xl items-stretch justify-around">
        {items.map(({ href, label, active, icon }) => (
          <li key={href} className="min-w-0 flex-1">
            <Link
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2.5 text-center ${
                active ? "text-[#0071e3]" : "text-[#1d1d1f]/50 hover:text-[#1d1d1f]/80"
              }`}
            >
              {icon}
              <span className={`text-[10px] font-medium tracking-tight ${active ? "text-[#0071e3]" : ""}`}>
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
