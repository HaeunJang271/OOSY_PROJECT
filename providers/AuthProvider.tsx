"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
          // 오프라인·일시 네트워크 실패 시 관리자 여부만 알 수 없음 → 비관리자로 처리
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
