import type { Expr } from "../expr.js";
import type { Turn } from "../turn.js";

export declare function system<E extends Expr[]>(
  template: TemplateStringsArray,
  ...expr: E
): Turn<E, "system">;

export declare function system<E extends Expr[]>(...expr: E): Turn<E, "system">;
