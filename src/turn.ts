import type { Kind, Expr } from "./expr.js";
import { Role } from "./role.js";

export type Turn<
  E extends Expr[],
  R extends Role | undefined = Role | undefined,
> = {
  [Kind]: "turn";
  role: R;
  template: TemplateStringsArray;
  expressions: E;
};
