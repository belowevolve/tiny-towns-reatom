import { reatomRoute } from "@reatom/core";

import { game } from "./model/game";

export const homeRoute = reatomRoute("", "homeRoute");
export const roomRoute = reatomRoute("room/:code", "roomRoute");

export const gameRoute = reatomRoute(
  {
    params() {
      if (game.phase() !== "playing") {
        homeRoute.go();
        return null;
      }
      return {};
    },
    path: "game",
  },
  "gameRoute"
);

export const resultsRoute = reatomRoute(
  {
    params() {
      if (game.phase() !== "finished") {
        homeRoute.go();
        return null;
      }
      return {};
    },
    path: "results",
  },
  "resultsRoute"
);
