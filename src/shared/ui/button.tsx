import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { palette, radius, shadow } from "./design-system";

type ButtonVariant = "action" | "secondary";

type ButtonProps = JSX.IntrinsicElements["button"] & {
  variant?: ButtonVariant;
};

const actionCss = css`
  padding: 8px 18px;
  border-radius: ${radius.sm};
  background: ${palette.accent};
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.15s ease;
  box-shadow: ${shadow.cell};
  font-family: inherit;

  &:hover {
    background: ${palette.accentHover};
    box-shadow: ${shadow.card};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const secondaryCss = css`
  padding: 8px 18px;
  border-radius: ${radius.sm};
  background: ${palette.surface};
  border: 1px solid ${palette.border};
  color: ${palette.text};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.15s ease;
  font-family: inherit;

  &:hover {
    background: ${palette.surfaceHover};
    border-color: ${palette.borderHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button = ({
  css: cssProp,
  variant = "action",
  ...props
}: ButtonProps) => (
  <button
    css={`
      ${variant === "action" ? actionCss : secondaryCss}${cssProp}
    `}
    {...props}
  />
);
