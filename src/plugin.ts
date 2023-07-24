import type ts from "typescript";
import type { TransformerExtras, PluginConfig } from "ts-patch";
import { Constraint, Comment, parseComment } from "./comment.js";
import type { JSONSchema7 } from "json-schema";

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
      return ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };

    function visit(node: ts.Node): ts.Node {
      if (isChatExpression(node)) {
        return injectSpec(node, {
          functions: getFunctionSpecs(node),
        });
      } else if (isChatFunctionExpression(node)) {
        const [func] = node.arguments;
        const type = checker.getTypeAtLocation(func);
        const symbol = type.getSymbol();
        if (symbol) {
          const spec = getFunctionSpec(symbol);
          if (spec) {
            return injectSpec(node, spec);
          }
        }
      }
      return ts.visitEachChild(node, visit, ctx);
    }

    function injectSpec(node: ts.CallExpression, data: any) {
      return factory.updateCallExpression(
        node,
        ts.visitNode(node.expression, visit) as ts.Expression,
        node.typeArguments?.map((t) => ts.visitNode(t, visit) as ts.TypeNode),
        [
          ...node.arguments.map((a) => ts.visitNode(a, visit) as ts.Expression),
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            toAST(data)
          ),
        ]
      );
    }

    // client.chat({ add(a: number, b: number) { return a + b; } })})
    function isChatExpression(node: ts.Node): node is ts.CallExpression {
      return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === "chat" &&
        // typeof client in client.chat(..) has __ts_chat property of type unique symbol
        isChatClient(checker.getTypeAtLocation(node.expression.expression))
      );
    }

    function isChatClient(type: ts.Type): boolean {
      // Get properties of the type
      const __ts_chat = type.getProperty("__ts_chat");
      if (__ts_chat) {
        const propType = checker.getTypeOfSymbol(__ts_chat);
        // Check if the type of the property is a unique symbol
        return checker.typeToString(propType) === "symbol";
      }
      return false;
    }

    /**
     * Detects the `chat.function` expression
     *
     * ```ts
     * function add(a: number, b: number) { return a + b; }
     *
     * chat.function(add)
     * ```
     */
    function isChatFunctionExpression(
      node: ts.Node
    ): node is ts.CallExpression {
      return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "chat" &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.text === "function"
      );
    }

    function isFunctionType(type: ts.Type): boolean {
      // Check if the type has call signatures
      const callSignatures = type.getCallSignatures();

      // If there's at least one call signature, it's a function type
      return callSignatures.length > 0;
    }

    function getFunctionSpecs(call: ts.CallExpression) {
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
            const spec = getFunctionSpec(symbol);
            if (spec === undefined) {
              return [];
            }
            return [[spec.name, spec]];
          })
        );
      }
      return undefined;
    }

    function getFunctionSpec(symbol: ts.Symbol) {
      if (symbol.valueDeclaration === undefined) {
        return undefined;
      }
      const type = checker.getTypeAtLocation(symbol.valueDeclaration);
      if (!isFunctionType(type)) {
        return undefined;
      }
      // TODO: what to do about multiple call signatures? union?
      const signature = type.getCallSignatures()[0];
      if (!signature) {
        return undefined;
      }

      const comments = getFunctionComments(symbol.valueDeclaration!);

      return {
        name: symbol.name,
        description: comments?.[0]?.content,
        parameterNames: signature.parameters.map((p) => p.name),
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            signature.parameters.map((parameter) => {
              const description = comments?.[0]?.params?.[parameter.name];

              if (
                parameter.valueDeclaration &&
                !ts.isParameter(parameter.valueDeclaration)
              ) {
                debugger;
              }
              return [
                parameter.name,
                getParameterSchema(
                  parameter as ts.Symbol & {
                    valueDeclaration?: ts.ParameterDeclaration;
                  },
                  description
                ),
              ];
            })
          ),
        },
      };
    }

    function getParameterSchema(
      parameter: ts.Symbol & {
        valueDeclaration?: ts.ParameterDeclaration;
      },
      description: string | undefined
    ) {
      if (parameter.valueDeclaration === undefined) {
        // "{}" is any in JSON Schema
        return {
          description,
        };
      }

      const parameterType = checker.getTypeOfSymbol(parameter);

      // optional comment attached to a parameter directly
      const paramComment = parseComment(ts, parameter.valueDeclaration);
      // follow type aliases and grab all comments
      const typeComments = getSymbolComments(parameter, new Set());

      return {
        ...typeToJSONSchema(parameterType, {
          existingDefinitions: {},
          comments: [
            // give priority to the comment on the parameter
            ...(paramComment ? [paramComment] : []),
            // then the comments on the type aliases in order of significance
            ...typeComments,
          ],
        }),
        description,
      };
    }

    function getSymbolComments(
      symbol: ts.Symbol,
      seen: Set<ts.Node | ts.Symbol>
    ): Comment[] {
      if (seen.has(symbol)) {
        return [];
      }
      seen.add(symbol);
      return (
        symbol.declarations?.flatMap((decl) => getNodeComments(decl, seen)) ??
        []
      );
    }

    function getNodeComments(node: ts.Node, seen: Set<ts.Node | ts.Symbol>) {
      if (seen.has(node)) {
        return [];
      }
      seen.add(node);
      if (ts.isParameter(node) && node.type) {
        return getNodeComments(node.type, seen);
      } else if (ts.isTypeReferenceNode(node)) {
        const symbol = checker.getSymbolAtLocation(node.typeName);
        if (symbol) {
          return getSymbolComments(symbol, seen);
        }
      } else if (ts.isTypeAliasDeclaration(node)) {
        const comment = parseComment(ts, node);
        const comments = comment ? [comment] : [];
        const type = checker.getTypeFromTypeNode(node.type);

        // If the type is not an alias, this is the termination
        if (!type.aliasSymbol) {
          return comments;
        }

        // Follow the alias
        return comments.concat(getSymbolComments(type.aliasSymbol, seen));
      } else if (ts.isImportSpecifier(node)) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) {
          // If this is an import specifier, follow it
          const aliasedSymbol = checker.getAliasedSymbol(symbol);

          // Follow the alias
          return getSymbolComments(aliasedSymbol, seen);
        }
      }
      return [];
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
      const declarationComments =
        symbol?.declarations?.map((declaration) =>
          parseComment(ts, declaration)
        ) ?? [];

      // Return both direct comments and declaration comments

      return [nodeComment, ...declarationComments].filter(
        (c): c is Exclude<typeof c, undefined> => c !== undefined
      );
    }

    function typeToJSONSchema(
      type: ts.Type | undefined,
      context: {
        existingDefinitions: {
          [key: string]: any;
        };
        isTopLevel?: boolean;
        comments?: Comment[];
      } = {
        existingDefinitions: {},
      }
    ): JSONSchema7 {
      if (!type) {
        return {};
      }
      const typeName = checker.typeToString(type);

      if (!context.isTopLevel && context.existingDefinitions?.[typeName]) {
        return { $ref: `#/definitions/${typeName}` };
      }

      function find<C extends keyof Comment>(constraint: C) {
        return context.comments?.find((c) => constraint in c)?.[constraint];
      }

      const description = find("content");

      if (type.flags & ts.TypeFlags.Number) {
        const type = find("type");
        return {
          type: type === "int" || type === "integer" ? "integer" : "number",
          description,
          minimum: find("minimum"),
          maximum: find("maximum"),
          multipleOf: find("multipleOf"),
          exclusiveMinimum: find("exclusiveMinimum"),
          exclusiveMaximum: find("exclusiveMaximum"),
        };
      } else if (type.flags & ts.TypeFlags.String) {
        return {
          type: "string",
          description,
          pattern: find("pattern"),
          format: find("format"),
          maxLength: find("maxLength"),
          minLength: find("minLength"),
        };
      } else if (type.flags & ts.TypeFlags.Boolean) {
        return { type: "boolean", description };
      } else if (
        type.flags & ts.TypeFlags.Object &&
        (type as ts.ObjectType).objectFlags &
          (ts.ObjectFlags.Tuple | ts.ObjectFlags.ArrayLiteral)
      ) {
        return {
          type: "array",
          items: (type as ts.TupleType).typeArguments?.map((typeArg) =>
            typeToJSONSchema(typeArg, {
              ...context,
              isTopLevel: false,
            })
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
              {
                ...context,
                isTopLevel: false,
              }
            ),
          };
        }, {});

        const definition = {
          type: "object" as const,
          properties,
        };

        if (!context.isTopLevel) {
          context.existingDefinitions[typeName] = definition;
        }

        return context.isTopLevel
          ? {
              ...definition,
              definitions: context.existingDefinitions,
            }
          : { $ref: `#/definitions/${typeName}` };
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
        const properties = Object.entries(obj).flatMap(([key, value]) => {
          if (value === undefined) {
            return [];
          }
          return [
            factory.createPropertyAssignment(
              factory.createIdentifier(key),
              toAST(value)
            ),
          ];
        });
        return factory.createObjectLiteralExpression(properties);
      } else {
        // TODO: set diagnostic? or fail silently?
        return factory.createIdentifier("undefined");
      }
    }
  };
}
