import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser { username: string; unit: string; name: string }

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

// Demo credentials (prototype only — never use in production)
const DEMO_USERS: Record<string, { password: string; unit: string; name: string }> = {
  "ears-07": { password: "ears123", unit: "EARS-07", name: "Capt. Arjun Verma" },
  "ears-12": { password: "ears123", unit: "EARS-12", name: "Capt. Priya Nair" },
  "admin":   { password: "admin",   unit: "EARS-HQ", name: "Dispatch Admin" },
};

const STORAGE_KEY = "ears.auth.user";

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login: AuthCtx["login"] = (username, password) => {
    const key = username.trim().toLowerCase();
    const rec = DEMO_USERS[key];
    if (!rec) return { ok: false, error: "Unknown driver ID" };
    if (rec.password !== password) return { ok: false, error: "Incorrect password" };
    setUser({ username: key, unit: rec.unit, name: rec.name });
    return { ok: true };
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const DEMO_CREDENTIALS = [
  { id: "ears-07", pwd: "ears123", role: "Driver" },
  { id: "ears-12", pwd: "ears123", role: "Driver" },
  { id: "admin",   pwd: "admin",   role: "Dispatch" },
];
