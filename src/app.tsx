import { computed, effect, peek } from "@reatom/core";

import { currentPlayer, game, localPlayerId } from "./model/game";
import { RESOURCE_COLORS, RESOURCE_NAMES } from "./model/types";
import { BuildDrawer } from "./ui/build-drawer";
import { BuildPanel } from "./ui/build-panel";
import { Drawer } from "./ui/drawer";
import { Grid } from "./ui/grid";
import { Lobby } from "./ui/lobby";
import { MultiplayerHud } from "./ui/multiplayer-hud";
import { Opponents } from "./ui/opponents";
import { ResourcePanel } from "./ui/resource-panel";

const startSingleplayer = () => {
  game.isMultiplayer.set(false);
  const player = game.addPlayer("local", "Игрок");
  localPlayerId.set("local");
  game.startGame();
  return player;
};

effect(() => {
  if (!game.isMultiplayer()) {
    return;
  }
  const resource = game.currentResource();
  const player = currentPlayer();
  if (player) {
    player.selectedResource.set(resource);
  }
}, "mp.autoSelectResource");

const PhaseBar = () => {
  const text = computed(() => {
    const resource = game.currentResource();
    if (!resource) {
      return "🔨 Выберите ресурс";
    }
    return "";
  }, "phaseBar.text");

  const badge = computed(() => {
    const resource = game.currentResource();
    if (!resource) {
      return "";
    }
    return (
      <span class="phase-badge">
        <span
          class="resource-swatch resource-swatch--sm"
          attr:style={`background:${RESOURCE_COLORS[resource]}`}
        />
        {RESOURCE_NAMES[resource]}
      </span>
    );
  }, "phaseBar.badge");

  return (
    <span class="phase-bar">
      {text}
      {badge}
    </span>
  );
};

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
  const isMP = game.isMultiplayer;

  const view = computed(() => {
    const player = currentPlayer();
    if (!player) {
      return <div>Загрузка…</div>;
    }

    return (
      <div class="app">
        <header class="app-header">
          {computed(() => (isMP() ? "" : <PhaseBar />))}
          <div class="app-header__right">
            <ScoreDisplay />
            {computed(() =>
              isMP() ? (
                ""
              ) : (
                <button class="btn-reset" on:click={game.resetGame}>
                  Сброс
                </button>
              )
            )}
          </div>
        </header>

        {computed(() => (isMP() ? <MultiplayerHud /> : ""))}
        {computed(() => (isMP() ? <Opponents /> : ""))}

        <Grid player={player} />

        {computed(() => (isMP() ? "" : <ResourcePanel player={player} />))}
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

const MainMenu = () => (
  <div class="main-menu">
    <h1 class="main-menu__title">Tiny Towns</h1>
    <div class="main-menu__buttons">
      <button
        class="btn-action lobby-btn-large"
        on:click={() => startSingleplayer()}
      >
        Одиночная игра
      </button>
      <button
        class="btn-secondary lobby-btn-large"
        on:click={() => {
          game.isMultiplayer.set(true);
          game.phase.set("lobby");
        }}
      >
        Мультиплеер
      </button>
    </div>
  </div>
);

export const App = () => {
  const appMode = computed(() => {
    const phase = game.phase();

    if (phase === "lobby") {
      if (game.isMultiplayer()) {
        return "lobby" as const;
      }
      return "menu" as const;
    }
    if (phase === "playing") {
      return "game" as const;
    }
    if (phase === "finished") {
      return "finished" as const;
    }
    return "menu" as const;
  }, "app.mode");

  const root = computed(() => {
    const mode = appMode();

    switch (mode) {
      case "menu": {
        return <MainMenu />;
      }
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
        return <MainMenu />;
      }
    }
  }, "app.root");

  return <>{root}</>;
};
