import { reatomRoute } from "@reatom/core";

import { game } from "./model/game";
import { GamePage } from "./routes/game";
import { HomePage } from "./routes/home";
import { ResultsPage } from "./routes/results";
import { RoomPage } from "./routes/room";

export const rootRoute = reatomRoute(
  {
    render({ outlet }) {
      return outlet();
    },
  },
  "rootRoute"
);

export const aboutRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    path: "about",
    render() {
      return "about";
    },
  },
  "aboutRoute"
);

export const homeRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    path: "",
    render() {
      return <HomePage />;
    },
  },
  "homeRoute"
);
export const roomRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    path: "room/:code",
    render() {
      return <RoomPage />;
    },
  },
  "roomRoute"
);

export const gameRoute = rootRoute.reatomRoute(
  {
    exactRender: true,
    params() {
      if (game.phase() !== "playing") {
        homeRoute.go();
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
        homeRoute.go();
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
