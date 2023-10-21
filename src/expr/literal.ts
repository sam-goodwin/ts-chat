import { Slot, SlotOptions } from "./slot.js";

export interface LiteralOptions<T extends string | number> extends SlotOptions {
  value: T;
}

export class Literal<T extends string | number> extends Slot<"literal"> {
  constructor(options: LiteralOptions<T>) {
    super("literal", options);
  }
}
