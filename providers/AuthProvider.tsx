"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { fetchUserProfile } from "@/lib/profile";
import { ensureMyPoints } from "@/lib/points";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  nickname: string | null;
  needsNickname: boolean;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  nickname: null,
  needsNickname: false,
  reloadProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [loginRewardOpen, setLoginRewardOpen] = useState(false);

  async function reloadProfile() {
    if (!user) {
      setNickname(null);
      setNeedsNickname(false);
      return;
    }
    try {
      const profile = await fetchUserProfile(user.uid);
      const n = profile?.nickname?.trim() ? profile.nickname : null;
      setNickname(n);
      setNeedsNickname(!n);
    } catch {
      setNickname(null);
      setNeedsNickname(false);
    }
  }

  useEffect(() => {
    const auth = getFirebaseAuth();
    setPersistence(auth, browserLocalPersistence).catch((err: unknown) => {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      console.error("[AUTH][AuthProvider] setPersistence error", { code });
    });
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("[AUTH][AuthProvider] onAuthStateChanged", {
        hasUser: Boolean(u),
        uid: u?.uid ?? null,
        provider: u?.providerData?.[0]?.providerId ?? null,
      });
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(getFirebaseDb(), "admins", u.uid));
          setIsAdmin(snap.exists());
        } catch {
          setIsAdmin(false);
        }
        // points가 없으면 기본값(10P) 세팅
        try {
          const didInit = await ensureMyPoints(u.uid);
          if (didInit) {
            setLoginRewardOpen(true);
            window.setTimeout(() => setLoginRewardOpen(false), 2500);
          }
        } catch {
          // ignore
        }
        try {
          const profile = await fetchUserProfile(u.uid);
          const n = profile?.nickname?.trim() ? profile.nickname : null;
          setNickname(n);
          setNeedsNickname(!n);
        } catch {
          setNickname(null);
          setNeedsNickname(false);
        }
      } else {
        setIsAdmin(false);
        setNickname(null);
        setNeedsNickname(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!needsNickname) return;
    if (pathname === "/nickname" || pathname === "/login") return;
    router.replace("/nickname");
  }, [loading, user, needsNickname, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, nickname, needsNickname, reloadProfile }}
    >
      {children}
      {loginRewardOpen && (
        <div className="fixed inset-x-0 top-14 z-50 mx-auto w-full max-w-2xl px-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm">
            <p className="font-semibold">로그인 보상 10P</p>
            <button
              type="button"
              onClick={() => setLoginRewardOpen(false)}
              className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
