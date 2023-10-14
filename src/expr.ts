import type { Infer } from "./infer.js";
import type { Input } from "./input.js";
import type { Program } from "./program.js";

export const Expr = Symbol.for("ts-chat.Expr");

export type Expr =
  | undefined
  | null
  | boolean
  | number
  | string
  | Input
  | Infer
  | Expr[]
  | Program<Expr[], any, any>
  | {
      [prop in string]: Expr;
    };
