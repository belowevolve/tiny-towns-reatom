import { computed, peek } from "@reatom/core";

import { game, localPlayerId } from "../model/game";
import { sortedScores } from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { homeRoute } from "../routes";

export const ResultsPage = () => {
  const list = computed(
    () =>
      sortedScores().map((s, i) => (
        <div
          class={[
            "game-finished__row",
            {
              "game-finished__row--self": s.id === peek(localPlayerId),
              "game-finished__row--winner": i === 0,
            },
          ]}
        >
          <span class="game-finished__place">{i + 1}.</span>
          <span class="game-finished__name">{s.name}</span>
          <span class="game-finished__score">{s.score} VP</span>
        </div>
      )),
    "results.list"
  );

  return (
    <div class="game-finished">
      <h2 class="game-finished__title">Игра окончена!</h2>
      <div class="game-finished__scores">{list}</div>
      <button
        class="btn-action"
        on:click={() => {
          localPlayerUI()?.reset();
          game.resetGame();
          homeRoute.go();
        }}
      >
        Новая игра
      </button>
    </div>
  );
};
