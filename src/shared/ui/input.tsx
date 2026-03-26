import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { cva } from "@/shared/lib/cva";
import type { VariantProps } from "@/shared/lib/cva";

import { colors, radius } from "./design-system";

const inputCss = cva({
  base: css`
    padding: 10px 14px;
    border: 2px solid ${colors.border};
    border-radius: ${radius.md};
    font-size: 1rem;
    font-family: inherit;
    background: ${colors.surface};
    color: ${colors.text.base};
    transition: border-color 0.15s ease;
    outline: none;

    &:focus {
      border-color: ${colors.accent};
    }
  `,
  variants: {
    variant: {
      code: css`
        text-align: center;
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: 0.3em;
      `,
    },
  },
});

type InputProps = JSX.IntrinsicElements["input"] &
  VariantProps<typeof inputCss>;

export const Input = ({ variant, css: cssProp, ...props }: InputProps) => (
  <input
    {...props}
    css={`
      ${inputCss({ variant })}
      ${cssProp}
    `}
  />
);
