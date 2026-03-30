import { defineRule, eslintCompatPlugin } from "@oxlint/plugins";
import type { Context, ESTree, Fixer, Range } from "@oxlint/plugins";

type RuleMode = "always" | "as-needed" | "never";
interface RuleOptions {
  nonComponentStyle?: RuleMode;
  requireReturnForObjectLiteral?: boolean;
}

const isComponentName = (name: string): boolean => /^[A-Z]/u.test(name);

const unwrapParenthesized = (node: ESTree.Node): ESTree.Node => {
  let current = node;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
};

const isObjectExpression = (node: ESTree.Node): boolean =>
  unwrapParenthesized(node).type === "ObjectExpression";

const getBodyReplacementRange = (
  context: Context,
  body: ESTree.Node
): Range => {
  const [start, end] = context.sourceCode.getRange(body);
  const { text } = context.sourceCode;
  let rangeStart = start;
  let rangeEnd = end;

  while (rangeStart > 0 && /\s/u.test(text[rangeStart - 1])) {
    rangeStart -= 1;
  }
  while (rangeEnd < text.length && /\s/u.test(text[rangeEnd])) {
    rangeEnd += 1;
  }

  if (text[rangeStart - 1] === "(" && text[rangeEnd] === ")") {
    return [rangeStart - 1, rangeEnd + 1];
  }

  return [start, end];
};

const isTopLevelComponentArrow = (
  node: ESTree.ArrowFunctionExpression
): boolean => {
  const { parent } = node;
  if (!parent || parent.type !== "VariableDeclarator") {
    return false;
  }
  if (parent.id.type !== "Identifier" || !isComponentName(parent.id.name)) {
    return false;
  }
  if (!parent.parent || parent.parent.type !== "VariableDeclaration") {
    return false;
  }

  const declaration = parent.parent;
  const statement = declaration.parent;
  return (
    statement?.type === "Program" ||
    (statement?.type === "ExportNamedDeclaration" &&
      statement.declaration === declaration)
  );
};

const getSingleReturnStatement = (
  block: ESTree.BlockStatement
): ESTree.ReturnStatement | null => {
  if (block.body.length !== 1) {
    return null;
  }
  const [onlyStatement] = block.body;
  if (onlyStatement.type !== "ReturnStatement" || !onlyStatement.argument) {
    return null;
  }
  return onlyStatement;
};

const toBlockBodyText = (
  context: Context,
  expressionNode: ESTree.Node
): string => {
  const exprText = context.sourceCode.getText(
    unwrapParenthesized(expressionNode)
  );
  return `{ return ${exprText}; }`;
};

const toConciseBodyText = (
  context: Context,
  expressionNode: ESTree.Node
): string => {
  if (!isObjectExpression(expressionNode)) {
    return context.sourceCode.getText(expressionNode);
  }
  const raw = unwrapParenthesized(expressionNode);
  return `(${context.sourceCode.getText(raw)})`;
};

const componentAwareArrowBodyStyleRule = defineRule({
  createOnce(context: Context) {
    const options = Array.isArray(context.options)
      ? ((context.options[0] as RuleOptions | undefined) ?? {})
      : {};
    const nonComponentStyle: RuleMode =
      options.nonComponentStyle ?? "as-needed";
    const requireReturnForObjectLiteral =
      options.requireReturnForObjectLiteral ?? false;

    return {
      ArrowFunctionExpression(node: ESTree.ArrowFunctionExpression) {
        const { body } = node;
        const componentArrow = isTopLevelComponentArrow(node);

        if (componentArrow) {
          if (body.type === "BlockStatement") {
            return;
          }
          context.report({
            fix(fixer: Fixer) {
              return fixer.replaceTextRange(
                getBodyReplacementRange(context, body),
                toBlockBodyText(context, body)
              );
            },
            message:
              "Top-level component arrow functions must use a block body: () => { return ...; }",
            node: body,
          });
          return;
        }

        if (nonComponentStyle === "always") {
          if (body.type === "BlockStatement") {
            return;
          }
          context.report({
            fix(fixer: Fixer) {
              return fixer.replaceTextRange(
                getBodyReplacementRange(context, body),
                toBlockBodyText(context, body)
              );
            },
            message:
              "Unexpected expression body; wrap arrow function body in braces.",
            node: body,
          });
          return;
        }

        if (body.type !== "BlockStatement") {
          return;
        }

        const onlyReturn = getSingleReturnStatement(body);
        if (!onlyReturn) {
          if (nonComponentStyle === "never") {
            context.report({
              message:
                "Unexpected block statement surrounding arrow body; expected a concise body.",
              node: body,
            });
          }
          return;
        }
        const returnArgument = onlyReturn.argument;
        if (!returnArgument) {
          return;
        }

        if (
          nonComponentStyle === "as-needed" &&
          requireReturnForObjectLiteral &&
          isObjectExpression(returnArgument)
        ) {
          return;
        }

        context.report({
          fix(fixer: Fixer) {
            return fixer.replaceText(
              body,
              toConciseBodyText(context, returnArgument)
            );
          },
          message:
            "Unexpected block statement surrounding arrow body; move returned value after `=>`.",
          node: body,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        "Apply arrow-body-style with top-level component override in TSX.",
    },
    fixable: "code",
    schema: [
      {
        additionalProperties: false,
        properties: {
          nonComponentStyle: {
            enum: ["always", "as-needed", "never"],
            type: "string",
          },
          requireReturnForObjectLiteral: {
            type: "boolean",
          },
        },
        type: "object",
      },
    ],
    type: "suggestion",
  },
});

export default eslintCompatPlugin({
  meta: {
    name: "component-arrow-body",
  },
  rules: {
    "component-aware-arrow-body-style": componentAwareArrowBodyStyleRule,
  },
});
