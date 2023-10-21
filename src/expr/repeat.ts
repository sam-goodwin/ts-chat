import type { Expr } from "./expr.js";
import { Slot, SlotOptions, isSlot } from "./slot.js";

export function isRepeatSlot(expr: Expr): expr is RepeatSlot<Expr[]> {
  return isSlot(expr) && expr.type === "repeat";
}

export function repeat(length: number) {
  return <E extends Expr[]>(template: TemplateStringsArray, ...expr: E) =>
    new RepeatSlot({ length, template: [...template.raw], expr });
}

export interface RepeatOptions<E extends Expr[]> extends SlotOptions {
  length: number;
  template: string[];
  expr: E;
}

export class RepeatSlot<E extends Expr[]> extends Slot<"repeat"> {
  constructor(readonly options: RepeatOptions<E>) {
    super("repeat", options);
  }
}
