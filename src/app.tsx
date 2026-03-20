import { computed } from "@reatom/core";

import { currentPlayer, game } from "./model/game";
import { RESOURCE_COLORS, RESOURCE_NAMES } from "./model/types";
import { BuildDrawer } from "./ui/build-drawer";
import { BuildPanel } from "./ui/build-panel";
import { Drawer } from "./ui/drawer";
import { Grid } from "./ui/grid";
import { ResourcePanel } from "./ui/resource-panel";

const PhaseBar = () => {
  const phaseContent = computed(() => {
    const resource = game.currentResource();
    if (!resource) {
      return "🔨 Выберите ресурс для размещения";
    }
    return "";
  }, "phaseBar.text");

  const resourceBadge = computed(() => {
    const resource = game.currentResource();
    if (!resource) {
      return "";
    }
    return (
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span
          class="resource-swatch"
          attr:style={`background:${RESOURCE_COLORS[resource]};width:20px;height:20px`}
        />
        {RESOURCE_NAMES[resource]}
      </span>
    );
  }, "phaseBar.resource");

  return (
    <div class="phase-indicator">
      <span>{phaseContent}</span>
      <span class="resource-announce">{resourceBadge}</span>
    </div>
  );
};

const ScoreDisplay = () => {
  const scoreDetails = computed(() => {
    const snap = currentPlayer.cells.map((c) => c());
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

  return (
    <div class="score-display">
      <span class="score-value">{currentPlayer.score}</span>
      <span class="score-label">{scoreDetails}</span>
    </div>
  );
};

export const App = () => (
  <div class="app">
    <header class="app-header">
      <h1>Tiny Towns</h1>
      <ScoreDisplay />
      <button class="btn-reset" on:click={game.resetGame}>
        Новая игра
      </button>
    </header>

    <PhaseBar />

    <main class="game-layout">
      <ResourcePanel player={currentPlayer} />
      <Grid player={currentPlayer} />
      <BuildPanel player={currentPlayer} />
    </main>

    <Drawer
      open={currentPlayer.drawerOpen}
      onClose={() => {
        if (currentPlayer.pendingBuildEffect()) {
          return;
        }
        if (currentPlayer.pendingWarehouseSwap()) {
          currentPlayer.cancelWarehouseSwap();
          return;
        }
        currentPlayer.cancelBuild();
      }}
    >
      <BuildDrawer player={currentPlayer} />
    </Drawer>
  </div>
);
