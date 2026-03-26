type VariantMap = Record<string, Record<string, string>>;
type StyleValue = string | null | undefined;

type VariantValue<T extends Record<string, string>> = keyof T extends
  | "true"
  | "false"
  ? keyof T | boolean
  : keyof T;

export type VariantSelection<T extends VariantMap> = {
  [K in keyof T]?: VariantValue<T[K]> | null | undefined;
};

export type VariantProps<T extends { variants: VariantMap }> = VariantSelection<
  T["variants"]
>;

const appendCss = (acc: string, value: StyleValue) => {
  if (!value) {
    return acc;
  }
  return acc ? `${acc}\n${value}` : value;
};

export const cva = <T extends VariantMap>(config: {
  base?: string;
  variants: T;
}) => {
  const recipe = (selection: VariantSelection<T> = {}) => {
    let result = config.base ?? "";

    for (const name in selection) {
      if (!Object.hasOwn(selection, name)) {
        continue;
      }

      const value = selection[name];
      if (value === null || value === undefined) {
        continue;
      }

      const key = typeof value === "boolean" ? `${value}` : String(value);
      result = appendCss(result, config.variants[name]?.[key]);
    }

    return result;
  };

  return Object.assign(recipe, { variants: config.variants });
};
