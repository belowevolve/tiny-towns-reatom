import { css } from "@reatom/jsx";

export const palette = {
  accent: "#7c9a6e",
  accentHover: "#6b8a5d",
  accentSoft: "#dcecd4",
  bg: "#faf8f5",
  border: "#e8e4df",
  borderActive: "#c8a87e",
  borderHover: "#d4cfc8",
  building: "#dcecd4",
  buildingBorder: "#b8d4a8",
  cellBg: "#f5f1ec",
  cellResource: "#eee8df",
  danger: "#c47a6e",
  dangerHover: "#b36a5e",
  dangerSoft: "#f5e0dc",
  highlight: "#f0c66b",
  highlightGlow: "rgba(240, 198, 107, 0.35)",
  highlightSoft: "#faf0d4",
  selected: "#6ea0c4",
  selectedGlow: "rgba(110, 160, 196, 0.3)",
  selectedSoft: "#dce8f0",
  shadow: "rgba(61, 52, 41, 0.07)",
  shadowElevated: "rgba(61, 52, 41, 0.1)",
  surface: "#ffffff",
  surfaceHover: "#f5f0eb",
  text: "#3d3429",
  textLight: "#b8ad9f",
  textMuted: "#9b9082",
} as const;

export const radius = {
  lg: "16px",
  md: "12px",
  sm: "8px",
  xl: "20px",
} as const;

export const shadow = {
  card: `0 2px 8px ${palette.shadow}`,
  cell: `0 1px 4px rgba(61, 52, 41, 0.06)`,
  elevated: `0 6px 20px ${palette.shadowElevated}`,
} as const;

export const globalStyleText = `
:root {
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light;
  color: ${palette.text};
  background-color: ${palette.bg};
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
    box-shadow: 0 0 8px ${palette.highlightGlow};
  }
  50% {
    box-shadow: 0 0 18px ${palette.highlightGlow};
  }
}
`;

export const pageShell = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
`;

export const cardScrollTrack = css`
  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${palette.cellBg};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${palette.borderHover};
    border-radius: 2px;
  }
`;

export const pulseAnimation = css`
  animation: cell-pulse 1.2s ease-in-out infinite;
`;
