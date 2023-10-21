import { type Expr, Kind } from "./expr.js";

export type If<
  Cond extends Expr = Expr,
  Then extends Expr = Expr,
  Else extends Expr | undefined = Expr | undefined,
> = {
  [Kind]: "if";
  cond: Cond;
  then: Then;
  else: Else;
};

export const If = <
  Cond extends Expr,
  Then extends Expr,
  Else extends Expr | undefined = undefined,
>(
  cond: Cond,
  then: Then,
  _else?: Else
): If<Cond, Then, Else> => ({
  [Kind]: "if",
  cond,
  then,
  else: _else!,
});
