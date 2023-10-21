import type { Expr } from "../expr/expr.js";
import type { Turn } from "../expr/turn.js";

export type LanguageGenerator<T> = Generator<Turn<Expr[], any>, T>;
