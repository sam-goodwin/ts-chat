import type { Expr } from "../expr/expr.js";
import type { Json } from "../expr/json.js";
import type { MatchSlot } from "../expr/match.js";
import type { NumberSlot } from "../expr/number.js";
import type { RangeSlot } from "../expr/range.js";
import type { RepeatSlot } from "../expr/repeat.js";
import type { Select } from "../expr/select.js";
import type { StringSlot } from "../expr/string.js";

/**
 * Compiles a Program to its input/output contract.
 */
export type Eval<E> = E extends StringSlot
  ? string
  : E extends NumberSlot | RangeSlot
  ? number
  : E extends Select<infer U>
  ? U
  : E extends MatchSlot
  ? string
  : E extends RepeatSlot<infer E>
  ? EvalBlock<E> extends infer E extends any[]
    ? (1 extends E["length"] ? E[0] : E)[]
    : never
  : E extends Json<infer J>
  ? Eval<J>
  : E extends any[]
  ? number extends E["length"]
    ? Eval<E[number]>[]
    : {
        [i in keyof E]: Eval<E[i]>;
      }
  : E extends Record<string, any>
  ? {
      [k in keyof E]: Eval<E[k]>;
    }
  : never;

export type EvalBlock<
  Block extends any[],
  Result extends any[] = [],
> = Block extends []
  ? Result
  : Block extends [infer Head, ...infer Tail]
  ? Head extends Expr
    ? EvalBlock<Tail, [...Result, Eval<Head>]>
    : EvalBlock<Tail, Result>
  : never;
