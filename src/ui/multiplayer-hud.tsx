import { computed } from "@reatom/core";

import { currentPlayer, game, localPlayerId } from "../model/game";
import { announceResource, markDone } from "../model/multiplayer/actions";
import { RESOURCES, RESOURCE_NAMES } from "../model/types";
import { ResourceSwatch } from "./resource-swatch";

const ResourcePicker = () => {
  const restricted = computed(() => {
    const player = currentPlayer();
    return player?.restrictedResources() ?? new Set();
  }, "mpPicker.restricted");

  return (
    <div class="mp-resource-picker">
      <h3 class="mp-resource-picker__title">Выберите ресурс для объявления</h3>
      <div class="mp-resource-picker__list">
        {RESOURCES.map((r) => (
          <button
            class={[
              "mp-resource-picker__item",
              {
                "mp-resource-picker__item--restricted": () =>
                  restricted().has(r),
              },
            ]}
            disabled={() => restricted().has(r)}
            on:click={() => announceResource(r)}
          >
            <ResourceSwatch resource={r} />
            <span class="mp-resource-picker__label">{RESOURCE_NAMES[r]}</span>
            {computed(() =>
              restricted().has(r) ? <span class="resource-lock">🔒</span> : ""
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MultiplayerHud = () => {
  const isMasterBuilder = computed(
    () => game.currentMasterBuilder()?.id === localPlayerId(),
    "mpHud.isMB"
  );

  const { turnPhase } = game;

  const masterBuilderName = computed(() => {
    const mb = game.currentMasterBuilder();
    return mb?.name ?? "";
  }, "mpHud.mbName");

  const myReadiness = computed(() => {
    const myId = localPlayerId();
    if (!myId) {
      return false;
    }
    return game.playerReadiness()[myId] ?? false;
  }, "mpHud.myReady");

  const announceSection = computed(() => {
    if (turnPhase() !== "announce") {
      return "";
    }

    if (isMasterBuilder()) {
      return <ResourcePicker />;
    }

    return (
      <div class="mp-waiting">🔨 {masterBuilderName} выбирает ресурс…</div>
    );
  }, "mpHud.announce");

  const resourceBadge = computed(() => {
    const resource = game.currentResource();
    if (!resource) {
      return "";
    }

    return (
      <div class="mp-announced-resource">
        <ResourceSwatch resource={resource} small />
        <span>{RESOURCE_NAMES[resource]}</span>
        {computed(() =>
          isMasterBuilder()
            ? " (вы объявили)"
            : ` (объявил ${masterBuilderName()})`
        )}
      </div>
    );
  }, "mpHud.badge");

  const hasPlaced = computed(() => {
    const player = currentPlayer();
    return player?.hasPlacedResource() ?? false;
  }, "mpHud.hasPlaced");

  const doneButton = computed(() => {
    const phase = turnPhase();
    if (phase === "announce") {
      return "";
    }
    if (!hasPlaced()) {
      return <div class="mp-done-status">Поставьте ресурс на поле</div>;
    }
    if (myReadiness()) {
      return <div class="mp-done-status">Ожидание других игроков…</div>;
    }

    return (
      <button class="btn-action mp-done-btn" on:click={() => markDone()}>
        Готово
      </button>
    );
  }, "mpHud.doneBtn");

  const turnInfo = computed(
    () => `Ход ${game.turnNumber() + 1}`,
    "mpHud.turnInfo"
  );

  return (
    <div class="mp-hud">
      <div class="mp-hud__top">
        <span class="mp-hud__turn">{turnInfo}</span>
        {resourceBadge}
      </div>
      {announceSection}
      {doneButton}
    </div>
  );
};
