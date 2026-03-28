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
