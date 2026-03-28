import { computed } from "@reatom/core";

import { actionBarMode } from "../model/game-ui";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { colors, radius, shadow } from "../shared/ui/design-system";
import { flex } from "../shared/ui/flex";
import { ResourceSwatch } from "../shared/ui/resource-swatch";
import { text } from "../shared/ui/text";

const barCss = `
  padding: 10px 16px;
  background: ${colors.surface};
  border-top: 1px solid ${colors.border};
  box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
  max-width: 520px;
  margin: 0 auto;
`;

const mutedHintCss = `
  text-align: center;
`;

export const ActionBar = () => {
  const content = computed(() => {
    const mode = actionBarMode();

    if (mode.type === "eliminated") {
      return (
        <div
          css={`
            ${flex({ align: "center", gap: 3, justify: "center" })}${barCss}
          `}
        >
          <span
            css={`
              ${text({ c: "muted", size: "sm" })}${mutedHintCss}
            `}
          >
            Вы выбыли из игры
          </span>
        </div>
      );
    }

    if (mode.type === "picker") {
      return (
        <div
          css={`
            ${flex({ align: "center", gap: 1.5, justify: "center" })}
            padding: 8px 16px 12px;
            background: ${colors.surface};
            border-top: 1px solid ${colors.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          <span css={text({ c: "muted", fw: "semibold", size: "xs" })}>
            Объявите ресурс
          </span>
          <div
            css={`
              display: flex;
              gap: 8px;
              justify-content: center;
            `}
          >
            {RESOURCES.map((r) => (
              <Button
                size="icon"
                variant="secondary"
                css={`
                  border: 2px solid ${colors.border};
                  border-radius: ${radius.sm};
                  transition: all 0.15s ease;

                  &:hover {
                    border-color: ${colors.accent};
                    box-shadow: ${shadow.card};
                    transform: translateY(-2px);
                  }

                  &:disabled {
                    opacity: 0.35;
                    pointer-events: none;
                  }
                `}
                disabled={mode.restricted.has(r)}
                on:click={() => announceResource(r)}
                title={RESOURCE_NAMES[r]}
              >
                <ResourceSwatch resource={r} size="sm" />
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (mode.type === "waiting") {
      return (
        <div
          css={`
            ${flex({ align: "center", gap: 3, justify: "center" })}${barCss}
          `}
        >
          <span
            css={`
              ${text({ c: "muted", size: "sm" })}${mutedHintCss}
            `}
          >
            🔨 {mode.name} выбирает ресурс…
          </span>
        </div>
      );
    }

    const badge = (
      <div
        css={`
          ${flex({ align: "center", direction: "row", gap: 1.5 })}
          font-size: 0.85rem;
        `}
      >
        <ResourceSwatch resource={mode.resource} size="sm" />
        <span css={text({ size: "sm" })}>{RESOURCE_NAMES[mode.resource]}</span>
      </div>
    );

    if (mode.type === "place") {
      return (
        <div
          css={`
            ${flex({ align: "center", gap: 3, justify: "center" })}${barCss}
          `}
        >
          {badge}
          <span
            css={`
              ${text({ c: "muted", size: "sm" })}${mutedHintCss}
            `}
          >
            Поставьте ресурс на поле
          </span>
        </div>
      );
    }

    if (mode.type === "ready") {
      return (
        <div
          css={`
            ${flex({ align: "center", gap: 3, justify: "center" })}${barCss}
          `}
        >
          {badge}
          <span
            css={`
              ${text({ c: "muted", size: "sm" })}${mutedHintCss}
            `}
          >
            Ожидание других игроков…
          </span>
        </div>
      );
    }

    return (
      <div
        css={`
          ${flex({ align: "center", gap: 3, justify: "center" })}${barCss}
        `}
      >
        {badge}
        <Button
          css="padding: 10px 32px; font-size: 0.95rem; font-weight: 600;"
          on:click={markDone}
        >
          Готово
        </Button>
      </div>
    );
  }, "actionBar.content");

  return (
    <div
      css={`
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
      `}
    >
      {content}
    </div>
  );
};
