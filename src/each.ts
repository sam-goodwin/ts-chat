import { Kind, type Expr } from "./expr.js";
import { Slot } from "./slot.js";

export type Each<E extends Expr> = {
  [Kind]: "each";
  fn: (item: any) => E;
};

export function each<Item extends Slot, E extends Expr>(
  items: Item,
  // fn: (item: Item["type"]) => E
  fn: (item: Item["value"]) => E
): Each<E>;

export function each<Item, E extends Expr>(
  items: Item[],
  fn: (item: Item) => E
): Each<E>;

export function each(items: any, fn: any) {
  return {
    [Kind]: "each",
    items,
    fn,
  } as const;
}
