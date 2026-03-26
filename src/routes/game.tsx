import { computed } from "@reatom/core";

import { currentPlayer } from "../model/game";
import { masterBuilderLabel, turnLabel } from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { palette } from "../shared/ui/design-system";
import { ActionBar } from "../ui/action-bar";
import { BuildDrawer } from "../ui/build-drawer";
import { BuildPanel } from "../ui/build-panel";
import { Drawer } from "../ui/drawer";
import { Grid } from "../ui/grid";
import { Opponents } from "../ui/opponents";

const ScoreDisplay = () => (
  <div
    css={`
      display: flex;
      align-items: baseline;
      gap: 4px;
    `}
  >
    <span
      css={`
        font-size: 1.1rem;
        font-weight: 700;
        color: ${palette.accent};
      `}
    >
      {computed(() => currentPlayer()?.score() ?? 0, "score.value")}
    </span>
    <span
      css={`
        font-size: 0.65rem;
        color: ${palette.textMuted};
      `}
    >
      {computed(() => currentPlayer()?.scoreDetails() ?? "", "score.details")}
    </span>
  </div>
);

const TurnInfo = () => (
  <div
    css={`
      display: flex;
      align-items: center;
      gap: 8px;
    `}
  >
    <span
      css={`
        font-size: 0.7rem;
        color: ${palette.textMuted};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      `}
    >
      {turnLabel}
    </span>
    <span
      css={`
        font-size: 0.7rem;
        color: ${palette.textMuted};
      `}
    >
      {masterBuilderLabel}
    </span>
  </div>
);

export const GamePage = computed(() => {
  const ui = localPlayerUI();
  if (!ui) {
    return <div>Загрузка…</div>;
  }
  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 10px 12px 80px;
        min-height: 100vh;
        max-width: 520px;
        margin: 0 auto;

        @media (max-width: 400px) {
          padding: 6px 8px 76px;
          gap: 8px;
        }
      `}
    >
      <header
        css={`
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;

          @media (max-width: 400px) {
            flex-wrap: nowrap;
          }
        `}
      >
        <div
          css={`
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex-shrink: 0;
          `}
        >
          <ScoreDisplay />
          <TurnInfo />
        </div>
        <div
          css={`
            flex: 1;
            min-width: 0;
            overflow-x: auto;
          `}
        >
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
