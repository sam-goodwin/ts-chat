import type { Expr } from "../expr.js";
import { assistant, system, user } from "../role.js";

export const Assistant = (props: { children: Expr | Expr[] }) => (
  <>{assistant`${props.children}`}</>
);

export const System = (props: { children: Expr | Expr[] }) => (
  <>{system`${props.children}`}</>
);

export const User = (props: { children: Expr | Expr[] }) => (
  <>{user`${props.children}`}</>
);
