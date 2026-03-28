import { computed } from "@reatom/core";

import { game, localPlayerId } from "@/model/game";
import { sortedScores } from "@/model/game-ui";
import { localPlayerUI } from "@/model/player-ui";
import { rootRoute } from "@/shared/lib/router";
import { Button } from "@/shared/ui/button";
import { colors, radius } from "@/shared/ui/design-system";
import { flex } from "@/shared/ui/flex";
import { text } from "@/shared/ui/text";

export const ResultsPage = () => {
  const list = computed(
    () =>
      sortedScores().map((s, i) => (
        <div
          css={`
            ${flex({ align: "center", direction: "row", gap: 2.5 })}
            padding: 12px 16px;
            background: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: ${radius.sm};

            &[data-winner="true"] {
              border-color: ${colors.highlight};
              background: ${colors.highlightSoft};
            }

            &[data-self="true"] {
              border-color: ${colors.accent};
            }
          `}
          attr:data-self={s.id === localPlayerId()}
          attr:data-winner={i === 0}
        >
          <span
            css={`
              ${text({ c: "muted", fw: "bold" })}min-width: 24px;
            `}
          >
            {i + 1}.
          </span>
          <span
            css={`
              ${text({ fw: "medium" })}flex: 1;
            `}
          >
            {s.name}
          </span>
          <span css={text({ c: "accent", fw: "bold", size: "lg" })}>
            {s.score} VP
          </span>
        </div>
      )),
    "results.list"
  );

  return (
    <div
      css={`
        ${flex({ align: "center", justify: "center" })}
        min-height: 100vh;
        padding: 24px;
      `}
    >
      <div css={flex({ align: "center", gap: 6, justify: "center" })}>
        <h2 css={text({ fw: "bold", size: "xl" })}>Игра окончена!</h2>
        <div
          css={`
            ${flex({ gap: 1.5 })}
            width: 100%;
            max-width: 360px;
          `}
        >
          {list}
        </div>
      </div>
      <Button
        on:click={() => {
          localPlayerUI()?.reset();
          game.resetGame();
          rootRoute.go();
        }}
      >
        Новая игра
      </Button>
    </div>
  );
};
