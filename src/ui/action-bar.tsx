import { computed } from "@reatom/core";

import { actionBarMode } from "../model/game-ui";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { ResourceSwatch } from "./resource-swatch";

export const ActionBar = () => {
  const content = computed(() => {
    const mode = actionBarMode();

    if (mode.type === "eliminated") {
      return (
        <div class="action-bar">
          <div class="action-bar__status">Вы выбыли из игры</div>
        </div>
      );
    }

    if (mode.type === "picker") {
      return (
        <div class="action-bar action-bar--picker">
          <span class="action-bar__label">Объявите ресурс</span>
          <div class="action-bar__resources">
            {RESOURCES.map((r) => (
              <button
                class={[
                  "action-bar__res-btn",
                  { "action-bar__res-btn--restricted": mode.restricted.has(r) },
                ]}
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
        <div class="action-bar">
          <div class="action-bar__status">🔨 {mode.name} выбирает ресурс…</div>
        </div>
      );
    }

    const badge = (
      <div class="action-bar__resource">
        <ResourceSwatch resource={mode.resource} small />
        <span>{RESOURCE_NAMES[mode.resource]}</span>
      </div>
    );

    if (mode.type === "place") {
      return (
        <div class="action-bar">
          {badge}
          <div class="action-bar__status">Поставьте ресурс на поле</div>
        </div>
      );
    }

    if (mode.type === "ready") {
      return (
        <div class="action-bar">
          {badge}
          <div class="action-bar__status">Ожидание других игроков…</div>
        </div>
      );
    }

    return (
      <div class="action-bar">
        {badge}
        <button class="btn-action action-bar__done" on:click={() => markDone()}>
          Готово
        </button>
      </div>
    );
  }, "actionBar.content");

  return <div class="action-bar-wrapper">{content}</div>;
};
