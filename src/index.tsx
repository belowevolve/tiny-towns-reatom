import { connectLogger } from "@reatom/core";
import { mount } from "@reatom/jsx";

import { App } from "./app";

if (import.meta.env.MODE === "development") {
  connectLogger();
}

// oxlint-disable-next-line typescript/no-non-null-assertion
mount(document.querySelector("#app")!, <App />);
