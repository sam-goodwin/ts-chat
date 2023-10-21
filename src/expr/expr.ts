import type { Literal } from "./literal.js";
import type { MatchSlot } from "./match.js";
import type { NumberSlot } from "./number.js";
import type { RangeSlot } from "./range.js";
import type { RepeatSlot } from "./repeat.js";
import type { Select } from "./select.js";
import type { StringSlot } from "./string.js";

export const Kind = Symbol.for("Kind");

export type Expr =
  | Literal<any>
  | MatchSlot
  | NumberSlot
  | Select<string>
  | StringSlot
  | RangeSlot
  | RepeatSlot<any>;
