import { computed, peek } from "@reatom/core";

import { game, localPlayerId } from "../model/game";
import { sortedScores } from "../model/game-ui";
import { localPlayerUI } from "../model/player-ui";
import { homeRoute } from "../routes";
import { Button } from "../shared/ui/button";
import { palette, radius } from "../shared/ui/design-system";

export const ResultsPage = () => {
  const list = computed(
    () =>
      sortedScores().map((s, i) => (
        <div
          css={`
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
          `}
          attr:data-self={s.id === peek(localPlayerId)}
          attr:data-winner={i === 0}
        >
          <span
            css={`
              font-weight: 700;
              font-size: 1rem;
              color: ${palette.textMuted};
              min-width: 24px;
            `}
          >
            {i + 1}.
          </span>
          <span
            css={`
              flex: 1;
              font-weight: 500;
            `}
          >
            {s.name}
          </span>
          <span
            css={`
              font-weight: 700;
              color: ${palette.accent};
              font-size: 1.1rem;
            `}
          >
            {s.score} VP
          </span>
        </div>
      )),
    "results.list"
  );

  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
      `}
    >
      <div
        css={`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
        `}
      >
        <h2
          css={`
            font-size: 1.8rem;
            font-weight: 800;
            color: ${palette.text};
            margin: 0;
          `}
        >
          Игра окончена!
        </h2>
        <div
          css={`
            width: 100%;
            max-width: 360px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          `}
        >
          {list}
        </div>
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
