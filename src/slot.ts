import { each, type Each } from "./each.js";
import { Kind, type Expr } from "./expr.js";
import { type, type valueOf } from "./type.js";

export type SlotOptions = {
  stop?: string;
  temperature?: number;
  maxTokens?: number;
};

export interface slot<ID extends string = string, Type extends type = any> {
  [Kind]: "slot";
  id: ID;
  type: Type;
  value: valueOf<Type>;
  options: SlotOptions | undefined;
  map: valueOf<Type> extends (infer v)[]
    ? <E extends Expr>(fn: (item: v) => E) => Each<slot<ID, Type>, E>
    : never;
}

export function slot<const ID extends string, const T extends type = "string">(
  id: ID,
  type?: T,
  options?: SlotOptions
): slot<ID, T> {
  const slot: slot<any, any> = {
    [Kind]: "slot",
    id,
    type: (type ?? "string") as T,
    options,
    // phantom value
    value: undefined as any,
    map: <E extends Expr>(fn: (item: any) => E) => each(slot, fn) as any,
  } as const;
  return slot;
}
