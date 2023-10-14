import { Expr } from "./expr.js";

export interface Program<Expressions extends Expr[], Input, Output> {
  template: TemplateStringsArray;
  expressions: Expressions;
  (input: Input): Output;
}
