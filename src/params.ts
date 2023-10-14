import type { Expr } from "./expr.js";
import type { Infer } from "./infer.js";
import type { Input } from "./input.js";
import type { valueOf } from "./type.js";
import type { UnionToIntersection } from "./util.js";

export type Params<
  E extends Expr,
  Name extends string | undefined = undefined,
> = E extends Input<undefined, infer Type>
  ? Name extends string
    ? {
        [name in Name]: valueOf<Type>;
      }
    : never
  : E extends Input<infer Name extends string, infer Type>
  ? {
      [name in Name]: valueOf<Type>;
    }
  : E extends Expr[]
  ? UnionToIntersection<Params<E[number], Name>>
  : E extends {
      [name in string]: Expr;
    }
  ? UnionToIntersection<
      {
        [name in Extract<keyof E, string>]: Params<E[name], name>;
      }[Extract<keyof E, string>]
    >
  : never;
