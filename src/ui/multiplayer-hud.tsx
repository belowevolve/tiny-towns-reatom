import { computed, peek } from "@reatom/core";

import { currentPlayer, game, localPlayerId } from "../model/game";
import { isHost } from "../model/lobby";
import {
  clientAnnounceResource,
  clientMarkDone,
} from "../model/multiplayer/client";
import { hostAnnounceResource, hostMarkDone } from "../model/multiplayer/host";
import { RESOURCES, RESOURCE_COLORS, RESOURCE_NAMES } from "../model/types";

const ResourcePicker = () => (
  <div class="mp-resource-picker">
    <h3 class="mp-resource-picker__title">Выберите ресурс для объявления</h3>
    <div class="mp-resource-picker__list">
      {RESOURCES.map((r) => (
        <button
          class="mp-resource-picker__item"
          on:click={() => {
            if (peek(isHost)) {
              hostAnnounceResource(r);
            } else {
              clientAnnounceResource(r);
            }
          }}
        >
          <span
            class="resource-swatch"
            attr:style={`background: ${RESOURCE_COLORS[r]}`}
          />
          <span class="mp-resource-picker__label">{RESOURCE_NAMES[r]}</span>
        </button>
      ))}
    </div>
  </div>
);

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

  const handleDone = () => {
    if (peek(isHost)) {
      hostMarkDone();
    } else {
      clientMarkDone();
    }
  };

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
        <span
          class="resource-swatch resource-swatch--sm"
          attr:style={`background: ${RESOURCE_COLORS[resource]}`}
        />
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
      <button class="btn-action mp-done-btn" on:click={handleDone}>
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
