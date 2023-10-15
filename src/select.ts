import { Kind } from "./expr.js";

export type Select<Options> = {
  [Kind]: "select";
  options: Options;
};
