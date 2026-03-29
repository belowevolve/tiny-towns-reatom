import "@/shared/lib/reatom-setup";
import { mount } from "@reatom/jsx";

import { App } from "./app";

if (!("interestForElement" in HTMLButtonElement.prototype)) {
  import("interestfor");
}

// oxlint-disable-next-line typescript/no-non-null-assertion
const root = document.querySelector("#app")!;
export const { unmount } = mount(root, <App />);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    unmount();
  });
}
