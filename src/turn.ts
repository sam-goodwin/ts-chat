import type { Kind, Expr } from "./expr.js";
import { Role } from "./role.js";

export type Turn<E extends Expr[], R extends Role = Role> = {
  [Kind]: "turn";
  role: R;
  expressions: E;
};
