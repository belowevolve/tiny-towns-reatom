const palette = {
  accent: "oklch(0.69 0.07 135)",
  accentHover: "oklch(0.62 0.07 135)",
  accentSoft: "oklch(0.93 0.04 135)",
  bg: "oklch(0.98 0.01 80)",
  border: "oklch(0.91 0.01 80)",
  borderActive: "oklch(0.76 0.06 70)",
  borderHover: "oklch(0.84 0.01 80)",
};

export const colors = {
  ...palette,
  building: "oklch(0.93 0.04 135)",
  buildingBorder: "oklch(0.84 0.05 135)",
  cellBg: "oklch(0.96 0.01 80)",
  cellResource: "oklch(0.94 0.01 80)",
  danger: "oklch(0.66 0.09 30)",
  dangerHover: "oklch(0.6 0.09 30)",
  dangerSoft: "oklch(0.93 0.04 30)",
  highlight: "oklch(0.85 0.11 85)",
  highlightGlow: "oklch(0.85 0.11 85 / 0.35)",
  highlightSoft: "oklch(0.95 0.04 85)",
  selected: "oklch(0.71 0.06 240)",
  selectedGlow: "oklch(0.71 0.06 240 / 0.3)",
  selectedSoft: "oklch(0.92 0.03 240)",
  shadow: "oklch(0.36 0.02 70 / 0.07)",
  shadowElevated: "oklch(0.36 0.02 70 / 0.1)",
  surface: "oklch(1 0 0)",
  surfaceHover: "oklch(0.96 0.01 70)",
  text: {
    accent: palette.accent,
    base: "oklch(0.34 0.02 70)",
    muted: "oklch(0.66 0.02 75)",
  },
} as const;

export const radius = {
  lg: "16px",
  md: "12px",
  sm: "8px",
  xl: "20px",
} as const;

export const shadow = {
  card: `0 2px 8px ${colors.shadow}`,
  cell: `0 1px 4px oklch(0.36 0.02 70 / 0.06)`,
  elevated: `0 6px 20px ${colors.shadowElevated}`,
} as const;

export const globalStyleText = `
:root {
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light;
  color: ${colors.text.base};
  background-color: ${colors.bg};
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#app {
  width: 100%;
}

[interestfor] {
  interest-delay-start: 0.5s;
  interest-delay-end: 0.1s;
  --interest-delay-start: 0.5s;
  --interest-delay-end: 0.1s;
}

[popover] {
  opacity: 0;
  transition:
    opacity 0.25s ease,
    display 0.25s allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
  }
}

@keyframes cell-pulse {
  0%,
  100% {
    box-shadow: 0 0 8px ${colors.highlightGlow};
  }
  50% {
    box-shadow: 0 0 18px ${colors.highlightGlow};
  }
}
`;
