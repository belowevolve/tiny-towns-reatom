import { action, atom, computed, reatomNumber } from "@reatom/core";

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

  const addPlayer = action((id: string, name: string) => {
    const player = reatomPlayer(id, name);
    players.set((list) => [...list, player]);
    return player;
  }, "game.addPlayer");

  const startGame = action(() => {
    phase.set("playing");
    turnPhase.set("announce");
    turnNumber.reset();
    resourceDeck.set(createResourceDeck());
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
  }, "game.announceResource");

  const finishPlacement = action(() => {
    turnPhase.set("build");
  }, "game.finishPlacement");

  const endTurn = action(() => {
    turnPhase.set("announce");
    turnNumber.increment();
    currentResource.set(null);
  }, "game.endTurn");

  const finishGame = action(() => {
    phase.set("finished");
  }, "game.finish");

  const resetGame = action(() => {
    for (const player of players()) {
      player.reset();
    }
    phase.set("playing");
    turnPhase.set("announce");
    turnNumber.set(0);
    resourceDeck.set(createResourceDeck());
    currentResource.set(null);
  }, "game.reset");

  const isGameOver = computed(
    (): boolean => phase() === "finished",
    "game.isOver"
  );

  return {
    addPlayer,
    announceResource,
    currentResource,
    endTurn,
    finishGame,
    finishPlacement,
    isGameOver,
    phase,
    players,
    resetGame,
    resourceDeck,
    startGame,
    turnNumber,
    turnPhase,
  };
};

export type GameState = ReturnType<typeof reatomGame>;

// --- Singleplayer instance ---

export const game = reatomGame();
export const currentPlayer: PlayerState = game.addPlayer("1", "Игрок");
game.startGame();
