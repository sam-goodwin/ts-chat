import type { $ } from "./$.js";
import type { Each } from "./each.js";
import type { Expr } from "./expr.js";
import type { json } from "./json.js";
import type { slot } from "./slot.js";
import type { Turn } from "./turn.js";
import type { valueOf } from "./type.js";
import type { UnionToIntersection } from "./util.js";

/**
 * The scope is a mapping of variable names to values.
 */
export type Scope = {
  [varName: string]: any;
};

export type Environment<
  // all names that are required as input ($ references that are not inferred before their de-reference)
  Input extends Scope = {},
  // all names in scope
  Names extends Scope = {},
  // all of the names that are in scope (including inputs and inferred outputs)
  Output extends Scope = {},
> = {
  input: Input;
  names: Names;
  output: Output;
};

/**
 * Compiles a Program to its input/output contract.
 */
export type compile<
  Program extends Expr[],
  Env extends Environment = Environment,
> = Program extends []
  ? Env
  : Program extends [infer e extends Expr, ...infer es extends Expr[]]
  ? e extends undefined | null | boolean | number | string
    ? compile<es, Env>
    : e extends $<infer ID, infer Type>
    ? ID extends keyof Env["names"]
      ? compile<es, Env>
      : compile<
          es,
          {
            input: Env["input"] & { [id in ID]: valueOf<Type> };
            names: Env["names"] & { [id in ID]: valueOf<Type> };
            output: Env["output"];
          }
        >
    : e extends slot<infer ID extends string, infer Type>
    ? compile<
        es,
        {
          input: Env["input"];
          names: Env["names"] & { [id in ID]: valueOf<Type> };
          output: Env["output"] & { [id in ID]: valueOf<Type> };
        }
      >
    : e extends Turn<infer E>
    ? compileBlock<E, es, Env>
    : e extends Each<infer Item extends Expr, infer E extends Expr>
    ? compileBlock<[Item, E], es, Env>
    : e extends Expr[]
    ? number extends e["length"]
      ? compileBlock<e, es, Env>
      : compileDistributed<e[number], es, Env>
    : e extends Record<string, infer E extends Expr>
    ? compileDistributed<E, es, Env>
    : e extends json<infer J extends Expr>
    ? compileDistributed<[J], es, Env>
    : Env
  : Env;

type compileDistributed<
  E extends Expr,
  Tail extends Expr[],
  Env extends Environment,
> = UnionToIntersection<
  compile<[E], Env> extends infer Env extends Environment
    ? compile<Tail, Env>
    : never
>;

type compileBlock<
  Block extends Expr[],
  Tail extends Expr[],
  Env extends Environment,
> = compile<Block, Env> extends infer Env extends Environment
  ? compile<Tail, Env>
  : never;
