import { Kind, type Expr } from "./expr.js";

export type json<E extends Expr> = {
  [Kind]: "json";
  expr: E;
};

export const json = <const E extends Expr>(expr: E): json<E> => ({
  [Kind]: "json",
  expr,
});
