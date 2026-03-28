import { game } from "@/model/game";
import { rootRoute } from "@/shared/lib/router";

import { GamePage } from "./ui/game";
import { ResultsPage } from "./ui/results/results";

export const gameRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    params() {
      if (game.phase() !== "playing") {
        rootRoute.go();
        return null;
      }
      return {};
    },
    path: "game",
    render() {
      return <GamePage />;
    },
  },
  "gameRoute"
);

export const resultsRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    params() {
      if (game.phase() !== "finished") {
        rootRoute.go();
        return null;
      }
      return {};
    },
    path: "results",
    render() {
      return <ResultsPage />;
    },
  },
  "resultsRoute"
);
