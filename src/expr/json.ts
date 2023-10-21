import { Kind } from "./expr.js";

export type Json<E> = {
  [Kind]: "json";
  expr: E;
};

export const json = <const E>(expr: E): Json<E> => ({
  [Kind]: "json",
  expr,
});
