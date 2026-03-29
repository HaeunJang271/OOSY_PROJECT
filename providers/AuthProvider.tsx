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
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
