import { action, atom, computed, peek, reatomNumber } from "@reatom/core";

import type { PlayerState } from "./player";
import { reatomPlayer } from "./player";
import type { GamePhase, Resource, TurnPhase } from "./types";

export const reatomGame = () => {
  const phase = atom<GamePhase>("lobby", "game.phase");
  const turnPhase = atom<TurnPhase>("announce", "game.turnPhase");
  const players = atom<PlayerState[]>([], "game.players");
  const currentResource = atom<Resource | null>(null, "game.currentResource");
  const turnNumber = reatomNumber(0, "game.turn");

  const masterBuilderIndex = reatomNumber(0, "game.masterBuilder");
  const playerReadiness = atom<Record<string, boolean>>({}, "game.readiness");
  const eliminatedPlayers = atom<Set<string>>(
    new Set<string>(),
    "game.eliminated"
  );

  const markPlayerDone = action((playerId: string) => {
    playerReadiness.set({
      ...playerReadiness(),
      [playerId]: true,
    });
  }, "game.markDone");

  const activePlayers = computed((): PlayerState[] => {
    const eliminated = eliminatedPlayers();
    return players().filter((p) => !eliminated.has(p.id));
  }, "game.activePlayers");

  const eliminatePlayer = action((playerId: string) => {
    const current = new Set([...eliminatedPlayers(), playerId]);
    eliminatedPlayers.set(current);
    markPlayerDone(playerId);
  }, "game.eliminate");

  const currentMasterBuilder = computed((): PlayerState | null => {
    const active = activePlayers();
    if (active.length === 0) {
      return null;
    }
    return active[masterBuilderIndex() % active.length] ?? null;
  }, "game.currentMasterBuilder");

  const allPlayersReady = computed((): boolean => {
    const readiness = playerReadiness();
    const active = activePlayers();
    if (active.length === 0) {
      return false;
    }
    return active.every((p) => readiness[p.id]);
  }, "game.allReady");

  const addPlayer = action((id: string, name: string) => {
    const player = reatomPlayer(id, name);
    players.set((list) => [...list, player]);
    return player;
  }, "game.addPlayer");

  const findPlayer = (id: string): PlayerState | undefined =>
    peek(players).find((p) => p.id === id);

  const startGame = action(() => {
    phase.set("playing");
    turnPhase.set("announce");
    turnNumber.reset();
    masterBuilderIndex.reset();
    playerReadiness.set({});
    eliminatedPlayers.set(new Set<string>());
  }, "game.start");

  const announceResource = action((resource: Resource): string[] => {
    currentResource.set(resource);
    turnPhase.set("place");

    const active = activePlayers();
    const readiness: Record<string, boolean> = {};
    const fullBoardIds: string[] = [];

    for (const p of active) {
      if (p.cells.every((c) => peek(c) !== null)) {
        fullBoardIds.push(p.id);
      } else {
        readiness[p.id] = false;
        p.hasPlacedResource.set(false);
      }
    }
    playerReadiness.set(readiness);

    for (const id of fullBoardIds) {
      eliminatePlayer(id);
    }

    return fullBoardIds;
  }, "game.announceResource");

  const rotateMasterBuilder = action(() => {
    const active = activePlayers();
    if (active.length === 0) {
      return;
    }
    masterBuilderIndex.set((peek(masterBuilderIndex) + 1) % active.length);
  }, "game.rotateMB");

  const endTurn = action((newMBIndex?: number) => {
    turnPhase.set("announce");
    turnNumber.increment();
    currentResource.set(null);
    if (newMBIndex === undefined) {
      rotateMasterBuilder();
    } else {
      masterBuilderIndex.set(newMBIndex);
    }
    playerReadiness.set({});
    for (const p of activePlayers()) {
      p.hasPlacedResource.set(false);
      p.resourceOverride.set(null);
    }
  }, "game.endTurn");

  const autoEliminateFullBoards = action((): string[] => {
    const active = activePlayers();
    const eliminated: string[] = [];
    for (const p of active) {
      if (p.cells.every((c) => peek(c) !== null)) {
        eliminatePlayer(p.id);
        eliminated.push(p.id);
      }
    }
    return eliminated;
  }, "game.autoEliminate");

  const finishGame = action(() => {
    phase.set("finished");
  }, "game.finish");

  const resetGame = action(() => {
    for (const player of players()) {
      player.reset();
    }
    players.set([]);
    phase.set("lobby");
    turnPhase.set("announce");
    turnNumber.set(0);
    masterBuilderIndex.set(0);
    playerReadiness.set({});
    eliminatedPlayers.set(new Set<string>());
    currentResource.set(null);
  }, "game.reset");

  return {
    activePlayers,
    addPlayer,
    allPlayersReady,
    announceResource,
    autoEliminateFullBoards,
    currentMasterBuilder,
    currentResource,
    eliminatePlayer,
    eliminatedPlayers,
    endTurn,
    findPlayer,
    finishGame,
    markPlayerDone,
    masterBuilderIndex,
    phase,
    playerReadiness,
    players,
    resetGame,
    rotateMasterBuilder,
    startGame,
    turnNumber,
    turnPhase,
  };
};

export type GameState = ReturnType<typeof reatomGame>;

export const game = reatomGame();
export const localPlayerId = atom<string | null>(null, "game.localPlayerId");

export const currentPlayer = computed((): PlayerState | null => {
  const id = localPlayerId();
  if (!id) {
    return null;
  }
  return game.findPlayer(id) ?? null;
}, "game.currentPlayer");
