import { defineConfig } from "vite";

export default defineConfig({
  oxc: {
    jsx: {
      pragma: "h",
      pragmaFrag: "hf",
      runtime: "classic",
    },
    jsxInject: `import { h, hf } from "@reatom/jsx"`,
    typescript: {
      jsxPragma: "h",
      jsxPragmaFrag: "hf",
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
