import { computed } from "@reatom/core";

import { currentPlayer, game } from "./model/game";
import { RESOURCE_COLORS, RESOURCE_NAMES } from "./model/types";
import { BuildDrawer } from "./ui/build-drawer";
import { BuildPanel } from "./ui/build-panel";
import { Drawer } from "./ui/drawer";
import { Grid } from "./ui/grid";
import { ResourcePanel } from "./ui/resource-panel";

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
      <PhaseBar />
      <div class="app-header__right">
        <ScoreDisplay />
        <button class="btn-reset" on:click={game.resetGame}>
          Сброс
        </button>
      </div>
    </header>

    <Grid player={currentPlayer} />

    <ResourcePanel player={currentPlayer} />
    <BuildPanel player={currentPlayer} />

    <Drawer
      open={currentPlayer.drawerOpen}
      onClose={() => {
        if (currentPlayer.pendingBuildEffect()) {
          return;
        }
        if (currentPlayer.pendingFactorySwap()) {
          currentPlayer.cancelFactorySwap();
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
