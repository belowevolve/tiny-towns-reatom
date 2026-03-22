import { computed, peek } from "@reatom/core";

import { game, localPlayerId } from "./model/game";
import {
  appView,
  masterBuilderLabel,
  scoreDetails,
  scoreValue,
  sortedScores,
  turnLabel,
} from "./model/game-ui";
import { localPlayerUI } from "./model/player-ui";
import { homeRoute } from "./routes";
import { ActionBar } from "./ui/action-bar";
import { BuildDrawer } from "./ui/build-drawer";
import { BuildPanel } from "./ui/build-panel";
import { Drawer } from "./ui/drawer";
import { Grid } from "./ui/grid";
import { Lobby } from "./ui/lobby";
import { Opponents } from "./ui/opponents";

const ScoreDisplay = () => (
  <div class="score-display">
    <span class="score-value">{scoreValue}</span>
    <span class="score-label">{scoreDetails}</span>
  </div>
);

const TurnInfo = () => (
  <div class="turn-info">
    <span class="turn-info__turn">{turnLabel}</span>
    <span class="turn-info__mb">{masterBuilderLabel}</span>
  </div>
);

const GameFinished = () => {
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
    "finished.list"
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

const GameView = () => {
  const view = computed(() => {
    const ui = localPlayerUI();
    if (!ui) {
      return <div>Загрузка…</div>;
    }

    return (
      <div class="app">
        <header class="game-header">
          <div class="game-header__left">
            <ScoreDisplay />
            <TurnInfo />
          </div>
          <div class="game-header__right">
            <Opponents />
          </div>
        </header>

        <Grid ui={ui} />
        <BuildPanel ui={ui} />

        <ActionBar />

        <Drawer open={ui.drawerOpen} onClose={() => ui.closeDrawer()}>
          <BuildDrawer ui={ui} />
        </Drawer>
      </div>
    );
  }, "app.gameView");

  return <>{view}</>;
};

export const App = () => {
  const root = computed(() => {
    const view = appView();
    if (view === "game") {
      return <GameView />;
    }
    if (view === "results") {
      return <GameFinished />;
    }
    return <Lobby />;
  }, "app.root");

  return <>{root}</>;
};
