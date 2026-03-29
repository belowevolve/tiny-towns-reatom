import { retryComputed } from "@reatom/core";

import { rootRoute } from "@/shared/lib/router";

import { HomePage } from "./ui/home";

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

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    delete rootRoute.routes[homeRoute.name];
    retryComputed(rootRoute.outlet);
  });
}
