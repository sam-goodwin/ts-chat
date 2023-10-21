import type { Expr } from "./expr.js";
import { Slot, SlotOptions, isSlot } from "./slot.js";

export function isStringSlot(expr: Expr): expr is StringSlot {
  return isSlot(expr) && expr.type === "string";
}

export class StringSlot extends Slot<"string"> {
  constructor(options?: SlotOptions) {
    super("string", options);
  }
}

export const string = new StringSlot();
