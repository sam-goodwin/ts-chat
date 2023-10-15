import type { Expr } from "./expr.js";
import type { Turn } from "./turn.js";

export const system = role("system");
export const user = role("user");
export const assistant = role("assistant");

export type Role = "system" | "assistant" | "user";

export declare function role<const R extends Role>(
  role: R
): <E extends Expr[]>(
  strings: TemplateStringsArray,
  ...values: E
) => Turn<E, R>;
