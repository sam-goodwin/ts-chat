import { Expr } from "./expr.js";
import { createTurn, type LanguageGenerator, type Turn } from "../index.js";
import type { Eval } from "../interpreter/eval.js";

export function* assistant<E extends Expr[]>(
  template: TemplateStringsArray,
  ...expr: E
): LanguageGenerator<Eval<E>> {
  return (yield createTurn("assistant", template, expr)) as Eval<E>;
}
