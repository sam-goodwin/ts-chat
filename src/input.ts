import { Expr } from "./expr.js";
import { type } from "./type.js";

export type Input<
  ID extends string | undefined = string | undefined,
  Type extends type = type,
> = {
  [Expr]: "input";
  id: ID;
  type: Type;
};

export function input<const Type extends type>(
  type: Type
): Input<undefined, Type>;

export function input<const ID extends string, const Type extends type>(
  id: ID,
  type: Type
): Input<ID, Type>;

export function input(...args: [type] | [string, type]) {
  if (args.length === 2) {
    const [id, type] = args as [string, type];
    return {
      [Expr]: "input",
      id,
      type,
    } as const;
  } else {
    const [type] = args as [type];
    return {
      [Expr]: "input",
      type,
    } as const;
  }
}
