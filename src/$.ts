import { each, type Each } from "./each.js";
import { type Expr, Kind } from "./expr.js";
import type { type, valueOf } from "./type.js";

export interface $<ID extends string, Type extends type = "string"> {
  [Kind]: "$";
  id: ID;
  type: Type;
  map: valueOf<Type> extends (infer v)[]
    ? <E extends Expr>(fn: (item: v) => E) => Each<$<ID, Type>, E>
    : never;
}

export function $<const ID extends string>(id: ID): $<ID, "string">;

export function $<const ID extends string, Type extends type>(
  id: ID,
  type: Type
): $<ID, Type>;

export function $(id: string, type?: type) {
  const v: $<any, any> = {
    [Kind]: "$",
    id,
    // @ts-ignore
    type: type ?? "string",
    map: (fn: any) => each(v as any, fn),
  };
  return v;
}
