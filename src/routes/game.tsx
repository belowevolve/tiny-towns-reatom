import { computed } from "@reatom/core";

import {
  masterBuilderLabel,
  scoreDetails,
  scoreValue,
  turnLabel,
} from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { ActionBar } from "../ui/action-bar";
import { BuildDrawer } from "../ui/build-drawer";
import { BuildPanel } from "../ui/build-panel";
import { Drawer } from "../ui/drawer";
import { Grid } from "../ui/grid";
import { Opponents } from "../ui/opponents";

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

export const GamePage = computed(() => {
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
}, "gamePage");
