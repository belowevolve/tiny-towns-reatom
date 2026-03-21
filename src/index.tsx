import { connectLogger } from "@reatom/core";
import { mount } from "@reatom/jsx";

import { App } from "./app";

if (!("interestForElement" in HTMLButtonElement.prototype)) {
  import("interestfor");
}

if (import.meta.env.MODE === "development") {
  connectLogger();
  const { initDebugPanel } = await import("./debug/debug-panel");
  initDebugPanel();
}

// oxlint-disable-next-line typescript/no-non-null-assertion
mount(document.querySelector("#app")!, <App />);
