// oxlint-disable sort-keys

const palette = {
  bg: "oklch(0.98 0.01 80)",
  accent: "oklch(0.69 0.07 135)",
  accentHover: "oklch(0.62 0.07 135)",
  accentSoft: "oklch(0.93 0.04 135)",
  danger: "oklch(0.66 0.09 30)",
  dangerHover: "oklch(0.6 0.09 30)",
  dangerSoft: "oklch(0.93 0.04 30)",
  border: "oklch(0.91 0.01 80)",
  borderActive: "oklch(0.76 0.06 70)",
  borderHover: "oklch(0.84 0.01 80)",
};

export const colors = {
  ...palette,
  error: palette.danger,
  success: palette.accent,
  info: palette.accent,
  custom: palette.accent,
  building: "oklch(0.93 0.04 135)",
  buildingBorder: "oklch(0.84 0.05 135)",
  cellBg: "oklch(0.96 0.01 80)",
  cellResource: "oklch(0.94 0.01 80)",
  highlightGlow: "oklch(0.85 0.11 85 / 0.35)",
  highlight: "oklch(0.85 0.11 85)",
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
    danger: palette.danger,
  },
} as const;
export type TextColor = keyof typeof colors.text;

export const rem = (value: number) => `${value / 4}rem`;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
} as const;

export const textSize = {
  xs: "font-size: 0.75rem; line-height: calc(1 / 0.75);",
  sm: "font-size: 0.875rem; line-height: calc(1.25 / 0.875);",
  md: "font-size: 1rem; line-height: 1.5;",
  lg: "font-size: 1.125rem; line-height: calc(1.75 / 1.125);",
  xl: "font-size: 1.5rem; line-height: calc(2 / 1.5);",
} as const;

export type TextSize = keyof typeof textSize;

export const shadow = {
  card: `0 2px 8px ${colors.shadow}`,
  cell: `0 1px 4px oklch(0.36 0.02 70 / 0.06)`,
  elevated: `0 6px 20px ${colors.shadowElevated}`,
} as const;

export const globalStyleText = `
:root {
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: ${colors.text.base};
  background-color: ${colors.bg};
}

#app {
  width: 100%; 
  min-height: 100dvh;
  display: flex;
  justify-content: center;
}

@layer root {
  [interestfor] {
    interest-delay-start: 0.5s;
    interest-delay-end: 0.25s;
    --interest-delay-start: 0.5s;
    --interest-delay-end: 0.25s;
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

  @keyframes lobby-bounce {
    0%, 80%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    40% {
      transform: translateY(-14px);
      opacity: 1;
    }
  }

  @keyframes toastEnter {
    from {
      transform: translateY(-40px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes lobby-pulse-ring {
    0% {
      transform: scale(0.9);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.2;
    }
    100% {
      transform: scale(0.9);
      opacity: 0.6;
    }
  }
}
`;
