import { reatomRoute } from "@reatom/core";

export const homeRoute = reatomRoute("", "homeRoute");
export const roomRoute = reatomRoute("room/:code", "roomRoute");
export const gameRoute = reatomRoute("game", "gameRoute");
export const resultsRoute = reatomRoute("results", "resultsRoute");
