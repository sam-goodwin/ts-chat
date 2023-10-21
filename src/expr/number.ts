import type { Expr } from "./expr.js";
import { Slot, SlotOptions, isSlot } from "./slot.js";

export function isNumberSlot(expr: Expr): expr is NumberSlot {
  return isSlot(expr) && expr.type === "number";
}

export class NumberSlot extends Slot<"number"> {
  constructor(options?: SlotOptions) {
    super("number", options);
  }
}

export const number = new NumberSlot();
