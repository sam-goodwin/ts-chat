import { trimTemplate } from "../util/trim-template.js";
import { Kind, Expr } from "./expr.js";
import type { Role } from "./role.js";

export type Turn<
  E extends Expr[],
  R extends Role | undefined = Role | undefined,
> = {
  [Kind]: "turn";
  role: R;
  template: string[];
  exprs: E;
};

export function createTurn<
  E extends Expr[],
  R extends Role | undefined = Role | undefined,
>(role: R, template: TemplateStringsArray, expr: E): Turn<E, R> {
  return {
    [Kind]: "turn",
    role,
    template: trimTemplate(template),
    exprs: expr,
  };
}
