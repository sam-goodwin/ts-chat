import { type Expr, Kind } from "../expr.js";

export const Json = <const E extends Expr>({
  children: expr,
}: {
  children: E;
}) => (
  <>
    {{
      [Kind]: "json",
      expr,
    }}
  </>
);
