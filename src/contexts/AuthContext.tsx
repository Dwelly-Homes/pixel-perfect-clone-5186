import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clearAuth } from "@/lib/api";

export type UserRole = "tenant_admin" | "agent_staff" | "caretaker" | "platform_admin" | "searcher";
export type AccountType = "estate_agent" | "landlord" | "searcher";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountType?: AccountType;
  tenantId?: string | null;
  isPhoneVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAuth = (u: AuthUser, accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Role helper hooks
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "platform_admin";
}

export function useIsTenantAdmin() {
  const { user } = useAuth();
  return user?.role === "tenant_admin";
}

export function useIsAgentOrAdmin() {
  const { user } = useAuth();
  return user?.role === "agent_staff" || user?.role === "tenant_admin" || user?.role === "platform_admin";
}
