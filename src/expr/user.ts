import type { Expr } from "./expr.js";
import type { Turn } from "./turn.js";

export declare function user<E extends any[]>(
  template: TemplateStringsArray,
  ...expr: E
): Turn<E, "user">;

export declare function user<E extends Expr[]>(...expr: E): Turn<E, "user">;
