import { computed } from "@reatom/core";
import { css } from "@reatom/jsx";

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

const appCss = css`
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
`;

const headerCss = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  @media (max-width: 400px) {
    flex-wrap: nowrap;
  }
`;

const headerLeftCss = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
`;

const headerRightCss = css`
  flex: 1;
  min-width: 0;
  overflow-x: auto;
`;

const scoreCss = css`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const scoreValueCss = css`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${palette.accent};
`;

const scoreLabelCss = css`
  font-size: 0.65rem;
  color: ${palette.textMuted};
`;

const turnCss = css`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const turnMetaCss = css`
  font-size: 0.7rem;
  color: ${palette.textMuted};
`;

const turnLabelCss = css`
  ${turnMetaCss}
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ScoreDisplay = () => (
  <div css={scoreCss}>
    <span css={scoreValueCss}>
      {computed(() => currentPlayer()?.score() ?? 0, "score.value")}
    </span>
    <span css={scoreLabelCss}>
      {computed(() => currentPlayer()?.scoreDetails() ?? "", "score.details")}
    </span>
  </div>
);

const TurnInfo = () => (
  <div css={turnCss}>
    <span css={turnLabelCss}>{turnLabel}</span>
    <span css={turnMetaCss}>{masterBuilderLabel}</span>
  </div>
);

export const GamePage = computed(() => {
  const ui = localPlayerUI();
  if (!ui) {
    return <div>Загрузка…</div>;
  }
  return (
    <div css={appCss}>
      <header css={headerCss}>
        <div css={headerLeftCss}>
          <ScoreDisplay />
          <TurnInfo />
        </div>
        <div css={headerRightCss}>
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
