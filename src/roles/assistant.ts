import type { Expr } from "../expr.js";
import type { Turn } from "../turn.js";

export declare function assistant<E extends Expr[]>(
  template: TemplateStringsArray,
  ...expr: E
): Turn<E, "assistant">;

export declare function assistant<E extends Expr[]>(
  ...expr: E
): Turn<E, "assistant">;
