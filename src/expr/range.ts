import type { Expr } from "./expr.js";
import { Slot, SlotOptions } from "./slot.js";

export function isRangeSlot(expr: Expr): expr is RangeSlot {
  return expr.type === "range";
}

export function range(from: number, to: number) {
  return new RangeSlot({ from, to });
}

export interface RangeSlotOptions extends SlotOptions {
  from: number;
  to: number;
}

export class RangeSlot extends Slot<"range"> {
  constructor(readonly options: RangeSlotOptions) {
    super("range", options);
    if (options.from > options.to) {
      throw new Error(
        `Invalid range: From(${options.from}) > To(${options.to})`
      );
    }
  }
}
