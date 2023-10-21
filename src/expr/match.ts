import { Expr } from "./expr.js";
import { Slot, SlotOptions, isSlot } from "./slot.js";

export function isMatchSlot(expr: Expr): expr is MatchSlot {
  return isSlot(expr) && expr.type === "match";
}

export function match(pattern: RegExp) {
  return new MatchSlot({ pattern });
}

export interface MatchOptions extends SlotOptions {
  pattern: RegExp;
}

export class MatchSlot extends Slot<"match"> {
  constructor(readonly options: MatchOptions) {
    super("match", options);
  }
}
