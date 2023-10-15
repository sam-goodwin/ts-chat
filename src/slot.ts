import { each, type Each } from "./each.js";
import { type Expr, Kind } from "./expr.js";
import { type, type valueOf } from "./type.js";

type SlotOptions = {
  stop?: string;
  temperature?: number;
  maxTokens?: number;
};

export type Slot<ID extends string = string, T extends type = any> = {
  [Kind]: "slot";
  id: ID;
  type: T;
  value: valueOf<T>;
  options: SlotOptions | undefined;
  map<E extends Expr>(fn: (item: valueOf<T>) => E): Each<E>;
};

export function slot<const ID extends string, const T extends type = "string">(
  id: ID,
  type?: T,
  options?: SlotOptions
): Slot<ID, T> {
  const slot: Slot<ID, T> = {
    [Kind]: "slot",
    id,
    type: (type ?? "string") as T,
    options,
    // phantom value
    value: undefined as any,
    map: <E extends Expr>(fn: (item: valueOf<T>) => E) =>
      each(slot, fn) as Each<any>,
  } as const;
  return slot;
}
