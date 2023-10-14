import { Expr } from "./expr.js";

export type Json<E extends Expr> = ReturnType<typeof json<E>>;

export const json = <const E extends Expr>(expr: E) => ({
  [Expr]: "json",
  expr,
});
