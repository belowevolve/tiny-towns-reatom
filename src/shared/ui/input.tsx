import { css } from "@reatom/jsx";
import type { JSX } from "@reatom/jsx/jsx-runtime";

import { palette, radius } from "./design-system";
import { createCssVariants } from "./style-variants";

type InputProps = JSX.IntrinsicElements["input"] & {
  code?: boolean;
};

const getInputCss = createCssVariants({
  base: css`
    padding: 10px 14px;
    border: 2px solid ${palette.border};
    border-radius: ${radius.md};
    font-size: 1rem;
    font-family: inherit;
    background: ${palette.surface};
    color: ${palette.text};
    transition: border-color 0.15s ease;
    outline: none;

    &:focus {
      border-color: ${palette.accent};
    }
  `,
  variants: {
    code: {
      false: "",
      true: css`
        text-align: center;
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: 0.3em;
        text-transform: uppercase;
      `,
    },
  },
});

export const TextInput = ({ code, css: cssProp, ...props }: InputProps) => (
  <input
    {...props}
    css={`
      ${getInputCss({ code: code ? "true" : "false" })}${cssProp}
    `}
  />
);
