import type { BuildingDef, BuildingType } from "./types";

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  chapel: {
    description: "Место для молитв",
    icon: "⛪",
    name: "Часовня",
    pattern: [
      { dc: 1, dr: 0, resource: "glass" },
      { dc: 0, dr: 1, resource: "stone" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "glass" },
    ],
  },
  cottage: {
    description: "Уютный домик",
    icon: "🏡",
    name: "Коттедж",
    pattern: [
      { dc: 1, dr: 0, resource: "wheat" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 1, dr: 1, resource: "glass" },
    ],
  },
  factory: {
    description: "Производство ресурсов",
    icon: "🏭",
    name: "Фабрика",
    pattern: [
      { dc: 0, dr: 0, resource: "wood" },
      { dc: 0, dr: 1, resource: "brick" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "stone" },
      { dc: 3, dr: 1, resource: "brick" },
    ],
  },
  tavern: {
    description: "Место для отдыха",
    icon: "🏪",
    name: "Таверна",
    pattern: [
      { dc: 0, dr: 0, resource: "brick" },
      { dc: 1, dr: 0, resource: "brick" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "wheat" },
    ],
  },
  theater: {
    description: "Культурный центр",
    icon: "🎭",
    name: "Театр",
    pattern: [
      { dc: 1, dr: 0, resource: "glass" },
      { dc: 0, dr: 1, resource: "wood" },
      { dc: 1, dr: 1, resource: "stone" },
      { dc: 2, dr: 1, resource: "wood" },
      { dc: 1, dr: 2, resource: "glass" },
    ],
  },
  well: {
    description: "Источник воды",
    icon: "⛲",
    name: "Колодец",
    pattern: [
      { dc: 0, dr: 0, resource: "wood" },
      { dc: 1, dr: 0, resource: "stone" },
    ],
  },
};
