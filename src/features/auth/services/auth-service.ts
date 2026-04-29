import { apiRequest } from "@lib/api";
import type { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginResponse {
  user: User;
}

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<{ success: true }>("/api/auth/logout", {
    method: "POST",
  });
}
