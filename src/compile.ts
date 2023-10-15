import type { $ } from "./$.js";
import type { Expr } from "./expr.js";
import type { Slot } from "./slot.js";
import type { Turn } from "./turn.js";
import type { valueOf } from "./type.js";

type program = [
  Turn<[$<"i">]>,
  Slot<"foo", "string">,
  $<"foo">,
  Turn<[$<"bar">]>,
  // Json<{
  //   key: Infer<"key", "string">;
  // }>,
];

type out = compile<program>;
declare const out: out;
out.input.i;
out.input.bar;
out.output.foo;

type compiled = compile<program, {}, {}>;
declare const compiled: compiled;
compiled.input.bar;
compiled.output.foo;
compiled.names.bar;
compiled.names.foo;

type prog2 = [
  Slot<"color", "'brown'|'red'">,
  Slot<"animal", "'fox'|'dog'|'cat'">,
  Slot<"obstacle", "'lazy dog'|'fence'|'wall'">,
];

type out2 = compile<prog2>;

/**
 * The scope is a mapping of variable names to values.
 */
export type Scope = {
  [varName: string]: any;
};

/**
 * Compiles a Program to its input/output contract.
 */
export type compile<
  Program extends Expr[],
  // all names that are required as input ($ references that are not inferred before their de-reference)
  Input extends Scope = {},
  // all names in scope
  Names extends Scope = {},
  // all of the names that are in scope (including inputs and inferred outputs)
  Output extends Scope = {},
> = Program extends []
  ? { input: Input; names: Names; output: Output }
  : Program extends [infer e extends Expr, ...infer es extends Expr[]]
  ? e extends $<infer ID, infer Type>
    ? ID extends keyof Names
      ? compile<es, Input, Names, Output>
      : compile<
          es,
          Input & { [id in ID]: valueOf<Type> },
          Names & { [id in ID]: valueOf<Type> },
          Output
        >
    : e extends Slot<infer ID extends string, infer Type>
    ? compile<
        es,
        Input,
        Names & { [id in ID]: valueOf<Type> },
        Output & { [id in ID]: valueOf<Type> }
      >
    : e extends Turn<infer E>
    ? compile<E, Input, Names, Output> extends {
        input: infer Input extends Scope;
        names: infer Names extends Scope;
        output: infer Output extends Scope;
      }
      ? compile<es, Input, Names, Output>
      : never
    : // : e extends Json<infer J>
      // ? compile<Extract<J[keyof J], Expr>, Input, Names, Output>
      never
  : never;
