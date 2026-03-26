type StyleValue = string | false | null | undefined;

export const cssJoin = (...values: StyleValue[]) =>
  values.filter(Boolean).join("\n");

type VariantMap = Record<string, Record<string, string>>;
type VariantSelection<T extends VariantMap> = {
  [K in keyof T]?: keyof T[K];
};

export const createCssVariants =
  <T extends VariantMap>(config: { base?: string; variants: T }) =>
  (selection: VariantSelection<T> = {}) =>
    cssJoin(
      config.base,
      ...Object.entries(selection).map(([name, value]) =>
        value ? config.variants[name]?.[value as string] : ""
      )
    );
