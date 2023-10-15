import { Kind, type Expr } from "./expr.js";
import { slot } from "./slot.js";

export type Each<Items, E extends Expr> = {
  [Kind]: "each";
  items: Items;
  fn: (item: any) => E;
};

export function each<Item extends slot, E extends Expr>(
  items: Item,
  // fn: (item: Item["type"]) => E
  fn: (item: Item["value"]) => E
): Each<Item, E>;

export function each<Item, E extends Expr>(
  items: Item[],
  fn: (item: Item) => E
): Each<Item, E>;

export function each(items: any, fn: any): any {
  return {
    [Kind]: "each",
    items,
    fn,
  } as const;
}
