import { computed } from "@reatom/core";

import { actionBarMode } from "../model/game-ui";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { palette, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";

export const ActionBar = () => {
  const content = computed(() => {
    const mode = actionBarMode();

    if (mode.type === "eliminated") {
      return (
        <div
          css={`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: ${palette.surface};
            border-top: 1px solid ${palette.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          <div
            css={`
              font-size: 0.8rem;
              color: ${palette.textMuted};
              text-align: center;
            `}
          >
            Вы выбыли из игры
          </div>
        </div>
      );
    }

    if (mode.type === "picker") {
      return (
        <div
          css={`
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 6px;
            padding: 8px 16px 12px;
            background: ${palette.surface};
            border-top: 1px solid ${palette.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          <span
            css={`
              font-size: 0.7rem;
              font-weight: 600;
              color: ${palette.textMuted};
              text-transform: uppercase;
              letter-spacing: 0.05em;
            `}
          >
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
                  border: 2px solid ${palette.border};
                  border-radius: ${radius.sm};
                  transition: all 0.15s ease;

                  &:hover {
                    border-color: ${palette.accent};
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
                <ResourceSwatch resource={r} small />
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: ${palette.surface};
            border-top: 1px solid ${palette.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          <div
            css={`
              font-size: 0.8rem;
              color: ${palette.textMuted};
              text-align: center;
            `}
          >
            🔨 {mode.name} выбирает ресурс…
          </div>
        </div>
      );
    }

    const badge = (
      <div
        css={`
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: ${palette.text};
        `}
      >
        <ResourceSwatch resource={mode.resource} small />
        <span>{RESOURCE_NAMES[mode.resource]}</span>
      </div>
    );

    if (mode.type === "place") {
      return (
        <div
          css={`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: ${palette.surface};
            border-top: 1px solid ${palette.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          {badge}
          <div
            css={`
              font-size: 0.8rem;
              color: ${palette.textMuted};
              text-align: center;
            `}
          >
            Поставьте ресурс на поле
          </div>
        </div>
      );
    }

    if (mode.type === "ready") {
      return (
        <div
          css={`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: ${palette.surface};
            border-top: 1px solid ${palette.border};
            box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
            max-width: 520px;
            margin: 0 auto;
          `}
        >
          {badge}
          <div
            css={`
              font-size: 0.8rem;
              color: ${palette.textMuted};
              text-align: center;
            `}
          >
            Ожидание других игроков…
          </div>
        </div>
      );
    }

    return (
      <div
        css={`
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 10px 16px;
          background: ${palette.surface};
          border-top: 1px solid ${palette.border};
          box-shadow: 0 -2px 12px oklch(0.36 0.02 70 / 0.08);
          max-width: 520px;
          margin: 0 auto;
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
