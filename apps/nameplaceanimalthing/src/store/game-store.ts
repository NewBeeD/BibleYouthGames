"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameRoomState } from "../types/game";

type Session = {
  userId: string;
  username: string;
  code: string;
  authToken: string;
};

type GameStore = {
  session: Session | null;
  game: GameRoomState | null;
  error: string | null;
  setSession: (session: Session | null) => void;
  setGame: (game: GameRoomState | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      session: null,
      game: null,
      error: null,
      setSession: (session) => set({ session }),
      setGame: (game) => set({ game }),
      setError: (error) => set({ error }),
      reset: () => set({ session: null, game: null, error: null }),
    }),
    {
      name: "nameplaceanimalthing-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
