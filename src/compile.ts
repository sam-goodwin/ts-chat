import type { Eval } from "./eval.js";
import type { Expr } from "./expr.js";
import type { Params } from "./params.js";
import type { Program } from "./program.js";

export type Compile<Expressions extends Expr[]> = Program<
  Expressions,
  Params<Expressions>,
  Eval<Expressions>
>;

// a tagged template string function, guidance
export declare function compile<Expressions extends Expr[]>(
  strings: TemplateStringsArray,
  ...values: Expressions
): Program<Expressions, Params<Expressions>, Eval<Expressions>>;

// TODO: implementation
