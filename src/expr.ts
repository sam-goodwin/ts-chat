import type { Slot } from "./slot.js";
import type { $ } from "./$.js";
import type { Json } from "./json.js";
import type { Turn } from "./turn.js";

export const Kind = Symbol.for("ts-chat.Expr");

export type Expr =
  | undefined
  | null
  | boolean
  | number
  | string
  | $
  | Slot
  | Turn<any, any>
  | Json<any>
  | {
      [prop in string]: Expr;
    };
