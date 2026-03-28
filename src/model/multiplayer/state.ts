import { atom } from "@reatom/core";

export const isHost = atom(false, "lobby.isHost");
export const hostPeerId = atom<string | null>(null, "lobby.hostPeerId");
