import { computed } from "@reatom/core";
import { css } from "@reatom/jsx";

import { actionBarMode } from "../model/game-ui";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { Button } from "../shared/ui/button";
import { palette, radius, shadow } from "../shared/ui/design-system";
import { ResourceSwatch } from "../shared/ui/resource-swatch";

const wrapperCss = css`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
`;

const barCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  background: ${palette.surface};
  border-top: 1px solid ${palette.border};
  box-shadow: 0 -2px 12px rgba(61, 52, 41, 0.08);
  max-width: 520px;
  margin: 0 auto;

  &[data-picker="true"] {
    flex-direction: column;
    gap: 6px;
    padding: 8px 16px 12px;
  }
`;

const labelCss = css`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${palette.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const resourcesCss = css`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const resourceButtonCss = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 2px solid ${palette.border};
  border-radius: ${radius.sm};
  cursor: pointer;
  background: ${palette.surface};
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${palette.accent};
    box-shadow: ${shadow.card};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const activeResourceCss = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: ${palette.text};
`;

const statusCss = css`
  font-size: 0.8rem;
  color: ${palette.textMuted};
  text-align: center;
`;

export const ActionBar = () => {
  const content = computed(() => {
    const mode = actionBarMode();

    if (mode.type === "eliminated") {
      return (
        <div css={barCss}>
          <div css={statusCss}>Вы выбыли из игры</div>
        </div>
      );
    }

    if (mode.type === "picker") {
      return (
        <div css={barCss} attr:data-picker="true">
          <span css={labelCss}>Объявите ресурс</span>
          <div css={resourcesCss}>
            {RESOURCES.map((r) => (
              <button
                css={resourceButtonCss}
                disabled={mode.restricted.has(r)}
                on:click={() => announceResource(r)}
                title={RESOURCE_NAMES[r]}
              >
                <ResourceSwatch resource={r} small />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (mode.type === "waiting") {
      return (
        <div css={barCss}>
          <div css={statusCss}>🔨 {mode.name} выбирает ресурс…</div>
        </div>
      );
    }

    const badge = (
      <div css={activeResourceCss}>
        <ResourceSwatch resource={mode.resource} small />
        <span>{RESOURCE_NAMES[mode.resource]}</span>
      </div>
    );

    if (mode.type === "place") {
      return (
        <div css={barCss}>
          {badge}
          <div css={statusCss}>Поставьте ресурс на поле</div>
        </div>
      );
    }

    if (mode.type === "ready") {
      return (
        <div css={barCss}>
          {badge}
          <div css={statusCss}>Ожидание других игроков…</div>
        </div>
      );
    }

    return (
      <div css={barCss}>
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

  return <div css={wrapperCss}>{content}</div>;
};
