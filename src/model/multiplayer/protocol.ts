import type { BuildMatch, CellContent, LobbyPlayer, Resource } from "../types";

// --- Host -> All messages ---

export interface GameStartMsg {
  type: "game-start";
  players: { id: string; name: string }[];
}

export interface ResourceAnnouncedMsg {
  type: "resource-announced";
  resource: Resource;
  masterBuilderId: string;
  turnNumber: number;
}

export interface PlayerActionMsg {
  type: "player-action";
  playerId: string;
  action: PlayerActionKind;
}

export type PlayerActionKind =
  | { kind: "place-resource"; index: number; resource: Resource }
  | { kind: "build-at-cell"; match: BuildMatch; targetIndex: number };

export interface PlayerEliminatedMsg {
  type: "player-eliminated";
  playerId: string;
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

// --- Player -> Host messages ---

export interface PlaceResourceMsg {
  type: "place-resource";
  index: number;
  resource: Resource;
}

export interface BuildAtCellMsg {
  type: "build-at-cell";
  match: BuildMatch;
  targetIndex: number;
}

export interface TurnDoneMsg {
  type: "turn-done";
}

export interface PlayerEliminatedSelfMsg {
  type: "player-eliminated-self";
}

// --- Bidirectional (lobby) ---

export interface AnnounceResourceMsg {
  type: "announce-resource";
  resource: Resource;
}

export interface PlayerInfoMsg {
  type: "player-info";
  name: string;
}

export type HostMessage =
  | GameStartMsg
  | ResourceAnnouncedMsg
  | PlayerActionMsg
  | PlayerEliminatedMsg
  | AllDoneMsg
  | GameOverMsg
  | LobbyStateMsg
  | KickPlayerMsg;

export type ClientMessage =
  | PlaceResourceMsg
  | BuildAtCellMsg
  | TurnDoneMsg
  | PlayerEliminatedSelfMsg
  | AnnounceResourceMsg
  | PlayerInfoMsg;

export type NetworkMessage = HostMessage | ClientMessage;
