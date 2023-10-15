import type { ReactElement } from "react";
import type { $ } from "./$.js";
import type { Each } from "./each.js";
import type { json } from "./json.js";
import type { slot } from "./slot.js";
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
  | slot<any, any>
  | Turn<any, any>
  | json<any>
  | Each<any, any>
  | Expr[]
  | ReactElement<Expr>
  | {
      [prop in string]: Expr;
    };
