import type { $ } from "./$.js";
import type { Each } from "./each.js";
import type { Json } from "./json.js";
import type { Slot } from "./slot.js";
import type { Turn } from "./turn.js";

export const Kind = Symbol.for("ts-chat.Expr");

export function expr<E extends Expr[] = []>(
  template: TemplateStringsArray,
  ...expressions: E
): Turn<E, undefined> {
  return {
    [Kind]: "turn",
    role: undefined,
    template,
    expressions,
  } as const;
}

export type Expr =
  | undefined
  | null
  | boolean
  | number
  | string
  | $<any, any>
  | Slot<any, any>
  | Turn<any, any>
  | Json<any>
  | Each<any, any>
  | Expr[]
  | {
      [prop in string]: Expr;
    };
