import type ts from "typescript";
import type { TransformerExtras, PluginConfig } from "ts-patch";

/** Changes string literal 'before' to 'after' */
export default function (
  program: ts.Program,
  pluginConfig: PluginConfig,
  { ts }: TransformerExtras
) {
  const typeChecker = program.getTypeChecker();

  return (ctx: ts.TransformationContext) => {
    const { factory } = ctx;

    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      function visit(node: ts.Node): ts.Node {
        if (isChatCallExpression(node)) {
        }
        return ts.visitEachChild(node, visit, ctx);
      }
      return ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
  };

  function isChatCallExpression(node: ts.Node): node is ts.CallExpression {
    return (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "chat"
    );
  }

  function getChatCallType(call: ts.CallExpression) {
    // get the type of F extends Functions in the Call expression
    const type = typeChecker.getTypeAtLocation(call.typeArguments![0]);

    if (type.isClassOrInterface()) {
      // loop through each of the properties, check if it is a function type, if it is, then create an object schema where each property is an argument to the function with a json schema corresponding to the type of the argument
      const properties = type.getProperties().reduce((props, symbol) => {
        if (symbol.valueDeclaration === undefined) {
          return props;
        }
        return {
          ...props,
          [symbol.name]: typeToJSONSchema(
            typeChecker.getTypeOfSymbolAtLocation(
              symbol,
              symbol.valueDeclaration
            )
          ),
        };
      });
    }
  }

  function typeToJSONSchema(
    type: ts.Type,
    existingDefinitions: any = {},
    isTopLevel: boolean = true
  ): any {
    const typeName = typeChecker.typeToString(type);

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
    } else if (type.isClassOrInterface() || type.flags & ts.TypeFlags.Object) {
      const properties = type.getProperties().reduce((props, symbol) => {
        if (symbol.valueDeclaration === undefined) {
          return props;
        }
        return {
          ...props,
          [symbol.name]: typeToJSONSchema(
            typeChecker.getTypeOfSymbolAtLocation(
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
}
