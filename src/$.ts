import { Kind } from "./expr.js";
import { type } from "./type.js";

export type $<ID extends string = string, Type extends type = "string"> = {
  [Kind]: "$";
  id: ID;
  type: Type;
};

export function $<const ID extends string, Type extends type = "string">(
  id: ID,
  type?: Type
): $<ID, Type> {
  return {
    [Kind]: "$",
    id,
    // @ts-ignore
    type: type ?? "string",
  } as const;
}
