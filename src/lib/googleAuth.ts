import type { AccountType, AuthUser } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function completeGoogleAuth(credential: string, accountType?: AccountType) {
  const { data } = await api.post("/auth/google", {
    credential,
    accountType,
  });

  return data.data as GoogleAuthResponse;
}
