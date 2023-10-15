import { Scope, compile } from "./compile.js";
import { Expr } from "./expr.js";

export class LLM {}

// if i use a class, we get an infinite type instantiation loop
// the workaround is to declare it as an interface
export interface AI {
  compile<E extends Expr[]>(
    template: TemplateStringsArray,
    ...expressions: E
  ): compile<E> extends {
    input: infer Input extends Scope;
    output: infer Output extends Scope;
  }
    ? {} extends Input
      ? () => Promise<Output>
      : (params: Input) => Promise<Output>
    : never;
}

export declare const AI: new () => AI;
