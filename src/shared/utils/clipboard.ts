import { atom } from "@reatom/core";

export const copyAtom = (name: string) =>
  atom(false, `${name}.isCopied`).extend((target) => ({
    copy: async (text: string) => {
      target.set(true);
      await navigator.clipboard.writeText(text);
      setTimeout(() => target.set(false), 1000);
    },
  }));
