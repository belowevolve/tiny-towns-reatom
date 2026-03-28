import type { JSX } from "@reatom/jsx/jsx-runtime";

import { colors, textSize } from "./design-system";
import type { TextColor, TextSize } from "./design-system";

interface TextProps {
  size?: TextSize;
  c?: TextColor;
  ta?: JSX.CSSProperties["text-align"];
  fw?: JSX.CSSProperties["font-weight"];
}

export const text = ({ size = "md", c, fw, ta }: TextProps) => `
  ${textSize[size]}
  color: ${c && colors.text[c]};
  font-weight: ${fw};
  text-align: ${ta};
`;
