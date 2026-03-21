import { computed, peek } from "@reatom/core";

import { currentPlayer, game, localPlayerId } from "./model/game";
import { BuildDrawer } from "./ui/build-drawer";
import { BuildPanel } from "./ui/build-panel";
import { Drawer } from "./ui/drawer";
import { Grid } from "./ui/grid";
import { Lobby } from "./ui/lobby";
import { MultiplayerHud } from "./ui/multiplayer-hud";
import { Opponents } from "./ui/opponents";

const ScoreDisplay = () => {
  const scoreDetails = computed(() => {
    const player = currentPlayer();
    if (!player) {
      return "";
    }
    const snap = player.cells.map((c) => c());
    const buildingCount = snap.filter((c) => c?.type === "building").length;
    const emptyCount = snap.filter((c) => c === null).length;
    const resourceCount = snap.filter((c) => c?.type === "resource").length;
    const parts: string[] = [];
    if (buildingCount > 0) {
      parts.push(`${buildingCount} зд.`);
    }
    if (resourceCount > 0) {
      parts.push(`${resourceCount} рес.`);
    }
    if (emptyCount > 0) {
      parts.push(`${emptyCount} пусто`);
    }
    return parts.join(" · ");
  }, "scoreDisplay.details");

  const scoreValue = computed(() => {
    const player = currentPlayer();
    if (!player) {
      return 0;
    }
    return player.score();
  }, "scoreDisplay.value");

  return (
    <div class="score-display">
      <span class="score-value">{scoreValue}</span>
      <span class="score-label">{scoreDetails}</span>
    </div>
  );
};

const GameFinished = () => {
  const scores = computed(
    () =>
      game.players().map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score(),
      })),
    "finished.scores"
  );

  const sortedScores = computed(
    () => [...scores()].toSorted((a, b) => b.score - a.score),
    "finished.sorted"
  );

  return (
    <div class="game-finished">
      <h2 class="game-finished__title">Игра окончена!</h2>
      <div class="game-finished__scores">
        {computed(() =>
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
          ))
        )}
      </div>
      <button class="btn-action" on:click={game.resetGame}>
        Новая игра
      </button>
    </div>
  );
};

const GameView = () => {
  const view = computed(() => {
    const player = currentPlayer();
    if (!player) {
      return <div>Загрузка…</div>;
    }

    return (
      <div class="app">
        <header class="app-header">
          <ScoreDisplay />
        </header>

        <MultiplayerHud />
        <Opponents />

        <Grid player={player} />
        <BuildPanel player={player} />

        <Drawer
          open={player.drawerOpen}
          onClose={() => {
            if (player.pendingBuildEffect()) {
              return;
            }
            if (player.pendingFactorySwap()) {
              player.cancelFactorySwap();
              return;
            }
            if (player.pendingWarehouseSwap()) {
              player.cancelWarehouseSwap();
              return;
            }
            player.cancelBuild();
          }}
        >
          <BuildDrawer player={player} />
        </Drawer>
      </div>
    );
  }, "app.gameView");

  return <>{view}</>;
};

export const App = () => {
  const appMode = computed(() => {
    const phase = game.phase();
    if (phase === "playing") {
      return "game" as const;
    }
    if (phase === "finished") {
      return "finished" as const;
    }
    return "lobby" as const;
  }, "app.mode");

  const root = computed(() => {
    const mode = appMode();

    switch (mode) {
      case "lobby": {
        return <Lobby />;
      }
      case "game": {
        return <GameView />;
      }
      case "finished": {
        return <GameFinished />;
      }
      default: {
        return <Lobby />;
      }
    }
  }, "app.root");

  return <>{root}</>;
};
