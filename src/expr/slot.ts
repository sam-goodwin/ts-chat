import { Expr, Kind } from "./expr.js";

export function isSlot(expr: Expr): expr is Slot<any> {
  return expr[Kind] === "slot";
}

export type SlotOptions = {
  temperature?: number;
  maxTokens?: number;
  bias?: Record<string, number>;
  stop?: string | string[];
};

export abstract class Slot<T extends string = any> {
  readonly [Kind] = "slot";
  constructor(
    readonly type: T,
    readonly options: SlotOptions = {}
  ) {}

  public with(options: Partial<SlotOptions>): this {
    return new (this.constructor as any)({
      ...this.options,
      ...options,
    }) as this;
  }

  public stop(stop: string | string[]) {
    return this.with({
      stop,
    });
  }
}
