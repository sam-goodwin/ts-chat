import { type Expr, Kind } from "./expr.js";

export type Json<E extends Expr> = {
  [Kind]: "json";
  expr: E;
};

export const json = <E extends Expr>(expr: E) => ({
  [Kind]: "json",
  expr,
});
