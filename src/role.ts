import { type Compile, compile } from "./compile.js";
import type { Expr } from "./expr.js";

export const system = role("system");
export const user = role("user");
export const assistant = role("assistant");

export type Role = "system" | "assistant" | "user";

export declare function role<R extends Role>(
  role: R
): <Program extends Expr[]>(
  strings: TemplateStringsArray,
  ...values: Program
) => Turn<R, Program>;

type Turn<R extends Role, Program extends Expr[]> = {
  role: R;
} & Compile<Program>;
