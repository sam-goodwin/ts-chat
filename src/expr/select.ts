import type { Expr } from "./expr.js";
import { SlotOptions, Slot } from "./slot.js";

export function isSelectSlot(expr: Expr): expr is Select<any> {
  return expr.type === "select";
}

export function select<T extends string>(...items: T[]) {
  return new Select({ items });
}

export interface SelectOptions<T extends string> extends SlotOptions {
  items: T[];
}

export class Select<T extends string> extends Slot<"select"> {
  constructor(readonly options: SelectOptions<T>) {
    super("select", options);
  }
}
