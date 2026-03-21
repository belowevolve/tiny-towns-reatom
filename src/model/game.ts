import { action, atom, computed, peek, reatomNumber } from "@reatom/core";

import type { PlayerState } from "./player";
import { reatomPlayer } from "./player";
import type { GamePhase, Resource, TurnPhase } from "./types";
import { RESOURCES } from "./types";

const shuffleArray = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const createResourceDeck = (): Resource[] => {
  const deck: Resource[] = [];
  for (let i = 0; i < 3; i += 1) {
    deck.push(...RESOURCES);
  }
  return shuffleArray(deck);
};

export const reatomGame = () => {
  const phase = atom<GamePhase>("lobby", "game.phase");
  const turnPhase = atom<TurnPhase>("announce", "game.turnPhase");
  const players = atom<PlayerState[]>([], "game.players");
  const currentResource = atom<Resource | null>(null, "game.currentResource");
  const turnNumber = reatomNumber(0, "game.turn");
  const resourceDeck = atom<Resource[]>([], "game.deck");
  const isMultiplayer = atom(false, "game.isMultiplayer");

  const masterBuilderIndex = reatomNumber(0, "game.masterBuilder");
  const playerReadiness = atom<Record<string, boolean>>({}, "game.readiness");
  const eliminatedPlayers = atom<Set<string>>(
    new Set<string>(),
    "game.eliminated"
  );

  const activePlayers = computed((): PlayerState[] => {
    const eliminated = eliminatedPlayers();
    return players().filter((p) => !eliminated.has(p.id));
  }, "game.activePlayers");

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

    if (!peek(isMultiplayer)) {
      resourceDeck.set(createResourceDeck());
    }
  }, "game.start");

  const announceResource = action((resource?: Resource) => {
    if (resource) {
      currentResource.set(resource);
    } else {
      const deck = resourceDeck();
      if (deck.length === 0) {
        phase.set("finished");
        return;
      }
      currentResource.set(deck[0]);
      resourceDeck.set(deck.slice(1));
    }
    turnPhase.set("place");

    const readiness: Record<string, boolean> = {};
    for (const p of activePlayers()) {
      readiness[p.id] = false;
      p.hasPlacedResource.set(false);
    }
    playerReadiness.set(readiness);
  }, "game.announceResource");

  const markPlayerDone = action((playerId: string) => {
    playerReadiness.set({
      ...playerReadiness(),
      [playerId]: true,
    });
  }, "game.markDone");

  const rotateMasterBuilder = action(() => {
    const active = activePlayers();
    if (active.length === 0) {
      return;
    }
    masterBuilderIndex.set((peek(masterBuilderIndex) + 1) % active.length);
  }, "game.rotateMB");

  const endTurn = action(() => {
    turnPhase.set("announce");
    turnNumber.increment();
    currentResource.set(null);
    rotateMasterBuilder();
    playerReadiness.set({});
    for (const p of activePlayers()) {
      p.hasPlacedResource.set(false);
    }
  }, "game.endTurn");

  const applyTurnEnd = action((newMBIndex: number) => {
    turnPhase.set("announce");
    turnNumber.increment();
    currentResource.set(null);
    masterBuilderIndex.set(newMBIndex);
    playerReadiness.set({});
    for (const p of activePlayers()) {
      p.hasPlacedResource.set(false);
    }
  }, "game.applyTurnEnd");

  const eliminatePlayer = action((playerId: string) => {
    const current = new Set([...eliminatedPlayers(), playerId]);
    eliminatedPlayers.set(current);

    markPlayerDone(playerId);
  }, "game.eliminate");

  const isGameOver = computed((): boolean => {
    if (phase() !== "playing") {
      return phase() === "finished";
    }
    const active = activePlayers();
    return active.length === 0 && players().length > 0;
  }, "game.isOver");

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
    isMultiplayer.set(false);
    resourceDeck.set([]);
    currentResource.set(null);
  }, "game.reset");

  return {
    activePlayers,
    addPlayer,
    allPlayersReady,
    announceResource,
    applyTurnEnd,
    currentMasterBuilder,
    currentResource,
    eliminatePlayer,
    eliminatedPlayers,
    endTurn,
    findPlayer,
    finishGame,
    isGameOver,
    isMultiplayer,
    markPlayerDone,
    masterBuilderIndex,
    phase,
    playerReadiness,
    players,
    resetGame,
    resourceDeck,
    rotateMasterBuilder,
    startGame,
    turnNumber,
    turnPhase,
  };
};

export type GameState = ReturnType<typeof reatomGame>;

// --- Singleton game instance ---

export const game = reatomGame();
export const localPlayerId = atom<string | null>(null, "game.localPlayerId");

export const currentPlayer = computed((): PlayerState | null => {
  const id = localPlayerId();
  if (!id) {
    return null;
  }
  return game.findPlayer(id) ?? null;
}, "game.currentPlayer");
