import { computed, peek } from "@reatom/core";
import { css } from "@reatom/jsx";

import { game, localPlayerId } from "../model/game";
import { sortedScores } from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { homeRoute } from "../routes";
import { Button } from "../shared/ui/button";
import { palette, pageShell, radius } from "../shared/ui/design-system";

const contentCss = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
`;

const titleCss = css`
  font-size: 1.8rem;
  font-weight: 800;
  color: ${palette.text};
  margin: 0;
`;

const scoresCss = css`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const rowCss = css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${palette.surface};
  border: 1px solid ${palette.border};
  border-radius: ${radius.sm};

  &[data-winner="true"] {
    border-color: ${palette.highlight};
    background: ${palette.highlightSoft};
  }

  &[data-self="true"] {
    border-color: ${palette.accent};
  }
`;

const placeCss = css`
  font-weight: 700;
  font-size: 1rem;
  color: ${palette.textMuted};
  min-width: 24px;
`;

const nameCss = css`
  flex: 1;
  font-weight: 500;
`;

const scoreCss = css`
  font-weight: 700;
  color: ${palette.accent};
  font-size: 1.1rem;
`;

export const ResultsPage = () => {
  const list = computed(
    () =>
      sortedScores().map((s, i) => (
        <div
          css={rowCss}
          attr:data-self={String(s.id === peek(localPlayerId))}
          attr:data-winner={String(i === 0)}
        >
          <span css={placeCss}>{i + 1}.</span>
          <span css={nameCss}>{s.name}</span>
          <span css={scoreCss}>{s.score} VP</span>
        </div>
      )),
    "results.list"
  );

  return (
    <div css={pageShell}>
      <div css={contentCss}>
        <h2 css={titleCss}>Игра окончена!</h2>
        <div css={scoresCss}>{list}</div>
      </div>
      <Button
        on:click={() => {
          localPlayerUI()?.reset();
          game.resetGame();
          homeRoute.go();
        }}
      >
        Новая игра
      </Button>
    </div>
  );
};
