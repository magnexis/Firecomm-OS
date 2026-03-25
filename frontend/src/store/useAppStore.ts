import { create } from "zustand";
import type { User } from "../types";

interface AppState {
  token: string | null;
  role: User["role"] | null;
  settings: Record<string, unknown>;
  setAuth: (token: string, role: User["role"]) => void;
  setSettings: (settings: Record<string, unknown>) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: null,
  role: null,
  settings: {},
  setAuth: (token, role) => set({ token, role }),
  setSettings: (settings) => set({ settings }),
  clearAuth: () => set({ token: null, role: null }),
}));
