import { Kind } from "./expr.js";

export type Json<E> = {
  [Kind]: "json";
  expr: E;
};

export const json = <E>(expr: E) => ({
  [Kind]: "json",
  expr,
});
