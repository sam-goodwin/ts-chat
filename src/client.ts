import type { Scope, compile } from "./compile.js";
import type { Expr } from "./expr.js";
import type { simplify } from "./simplify.js";

export interface LLM {}

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
      : (params: simplify<Input & Partial<Output>>) => Promise<simplify<Output>>
    : never;

  compile<E extends Expr[]>(
    ...expressions: E
  ): compile<E> extends {
    input: infer Input extends Scope;
    output: infer Output extends Scope;
  }
    ? {} extends Input
      ? () => Promise<Output>
      : (params: simplify<Input & Partial<Output>>) => Promise<simplify<Output>>
    : never;
}

export declare const AI: new () => AI;
