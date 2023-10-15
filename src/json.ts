import { Kind, type Expr } from "./expr.js";

export type Json<E extends Expr> = {
  [Kind]: "json";
  expr: E;
};

export const json = <const E extends Expr>(expr: E): Json<E> => ({
  [Kind]: "json",
  expr,
});
