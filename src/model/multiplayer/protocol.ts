import type { CellContent, LobbyPlayer, Resource } from "../types";

// --- Broadcast by any player ---

export interface ResourceAnnouncedMsg {
  type: "resource-announced";
  resource: Resource;
  masterBuilderId: string;
  turnNumber: number;
}

export interface PlayerGridMsg {
  type: "player-grid";
  playerId: string;
  grid: CellContent[];
  hasPlacedResource: boolean;
}

export interface TurnDoneMsg {
  type: "turn-done";
  playerId: string;
}

export interface PlayerEliminatedMsg {
  type: "player-eliminated";
  playerId: string;
}

// --- Host-only broadcasts ---

export interface GameStartMsg {
  type: "game-start";
  players: { id: string; name: string }[];
}

export interface AllDoneMsg {
  type: "all-done";
  turnNumber: number;
  masterBuilderIndex: number;
}

export interface GameOverMsg {
  type: "game-over";
  scores: { playerId: string; score: number; grid: CellContent[] }[];
}

export interface LobbyStateMsg {
  type: "lobby-state";
  players: LobbyPlayer[];
  hostId: string;
}

export interface KickPlayerMsg {
  type: "kick-player";
  peerId: string;
}

// --- Client -> specific peer (lobby) ---

export interface PlayerInfoMsg {
  type: "player-info";
  name: string;
}

export type NetworkMessage =
  | ResourceAnnouncedMsg
  | PlayerGridMsg
  | TurnDoneMsg
  | PlayerEliminatedMsg
  | GameStartMsg
  | AllDoneMsg
  | GameOverMsg
  | LobbyStateMsg
  | KickPlayerMsg
  | PlayerInfoMsg;
