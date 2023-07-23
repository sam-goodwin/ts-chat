import type ts from "typescript";
import type { TransformerExtras, PluginConfig } from "ts-patch";
import { parseComment } from "./parse-comment.js";

/** Changes string literal 'before' to 'after' */
export default function (
  program: ts.Program,
  pluginConfig: PluginConfig,
  { ts }: TransformerExtras
) {
  const checker = program.getTypeChecker();

  return (ctx: ts.TransformationContext) => {
    const { factory } = ctx;

    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      function visit(node: ts.Node): ts.Node {
        if (isChatCallExpression(node)) {
          const schemas = getFunctionSchemas(node);

          return factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            [
              ...node.arguments,
              factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                toAST({
                  schemas,
                })
              ),
            ]
          );
        }
        return ts.visitEachChild(node, visit, ctx);
      }
      return ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
    function isChatCallExpression(node: ts.Node): node is ts.CallExpression {
      return (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "chat"
      );
    }

    function isFunctionType(type: ts.Type): boolean {
      // Check if the type has call signatures
      const callSignatures = type.getCallSignatures();

      // If there's at least one call signature, it's a function type
      return callSignatures.length > 0;
    }

    function getFunctionSchemas(call: ts.CallExpression) {
      // get the type of F extends Functions in the Call expression

      if (![1, 2].includes(call.arguments.length)) {
        // must be 1 or 2 arguments
        return undefined;
      }
      const [functions] = call.arguments;

      const functionsType = checker.getTypeAtLocation(functions);

      if (
        functionsType.isClassOrInterface() ||
        functionsType.flags & ts.TypeFlags.Object
      ) {
        return Object.fromEntries(
          functionsType.getProperties().flatMap((symbol) => {
            if (symbol.valueDeclaration === undefined) {
              return [];
            }
            const functionType = checker.getTypeAtLocation(
              symbol.valueDeclaration
            );
            if (!isFunctionType(functionType)) {
              return [];
            }
            const functionName = symbol.name;
            const schema = typeToJSONSchema(functionType);
            const comments = getFunctionComments(symbol.valueDeclaration);
            return [
              [
                functionName,
                {
                  functionName,
                  schema,
                  comments,
                },
              ],
            ];
          })
        );
      }
      return undefined;
    }

    function getFunctionComments(node: ts.Node) {
      const type = checker.getTypeAtLocation(node);

      // Check if it's a function type
      if (!isFunctionType(type)) {
        return undefined;
      }

      /**
       * Comments directly on the property node.
       */
      const nodeComment = parseComment(ts, node);

      let symbol = type.getSymbol();
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol);
      }

      // Get comments on the symbol's declarations
      const declarationComments = symbol?.declarations?.map((declaration) =>
        parseComment(ts, declaration)
      );

      // Return both direct comments and declaration comments

      return {
        node: nodeComment,
        declarations: declarationComments,
      };
    }

    function typeToJSONSchema(
      type: ts.Type,
      existingDefinitions: any = {},
      isTopLevel: boolean = true
    ): any {
      const typeName = checker.typeToString(type);

      if (!isTopLevel && existingDefinitions[typeName]) {
        return { $ref: `#/definitions/${typeName}` };
      }

      if (type.flags & ts.TypeFlags.Number) {
        return { type: "number" };
      } else if (type.flags & ts.TypeFlags.String) {
        return { type: "string" };
      } else if (type.flags & ts.TypeFlags.Boolean) {
        return { type: "boolean" };
      } else if (
        type.flags & ts.TypeFlags.Object &&
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Tuple
      ) {
        return {
          type: "array",
          items: (type as ts.TupleType).typeArguments?.map((typeArg) =>
            typeToJSONSchema(typeArg, existingDefinitions, false)
          ),
        };
      } else if (
        type.isClassOrInterface() ||
        type.flags & ts.TypeFlags.Object
      ) {
        const properties = type.getProperties().reduce((props, symbol) => {
          if (symbol.valueDeclaration === undefined) {
            return props;
          }
          return {
            ...props,
            [symbol.name]: typeToJSONSchema(
              checker.getTypeOfSymbolAtLocation(
                symbol,
                symbol.valueDeclaration
              ),
              existingDefinitions,
              false
            ),
          };
        }, {});

        const definition = {
          type: "object",
          properties,
        };

        if (!isTopLevel) {
          existingDefinitions[typeName] = definition;
        }

        return isTopLevel ? definition : { $ref: `#/definitions/${typeName}` };
      } else {
        throw new Error("Unsupported type: " + type.flags);
      }
    }

    function toAST(obj: unknown): ts.Expression {
      if (obj === undefined) {
        return factory.createIdentifier("undefined");
      } else if (obj === null) {
        return factory.createNull();
      } else if (typeof obj === "string") {
        return factory.createStringLiteral(obj);
      } else if (typeof obj === "number") {
        return factory.createNumericLiteral(obj);
      } else if (typeof obj === "boolean") {
        return obj ? factory.createTrue() : factory.createFalse();
      } else if (Array.isArray(obj)) {
        const elements = obj.map((element) => toAST(element));
        return factory.createArrayLiteralExpression(elements);
      } else if (obj === null) {
        return factory.createNull();
      } else if (typeof obj === "object") {
        const properties = Object.entries(obj).map(([key, value]) =>
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            toAST(value)
          )
        );
        return factory.createObjectLiteralExpression(properties);
      } else {
        // TODO: set diagnostic? or fail silently?
        return factory.createIdentifier("undefined");
      }
    }
  };
}
