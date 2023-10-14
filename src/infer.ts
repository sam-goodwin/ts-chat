import { Expr } from "./expr.js";
import { type } from "./type.js";

type InferOptions = {
  stop?: string;
  temperature?: number;
  maxTokens?: number;
};

export type Infer<
  ID extends string | undefined = string | undefined,
  T extends type = any,
  Options extends InferOptions | undefined = InferOptions | undefined,
> = {
  [Expr]: "infer";
  id: ID;
  type: T;
  options: Options;
};

export function infer<
  const T extends type = "string",
  const Options extends InferOptions | undefined = undefined,
>(type: T, options?: Options): Infer<undefined, T, Options>;

export function infer<
  const ID extends string,
  const T extends type = "string",
  const Options extends InferOptions | undefined = undefined,
>(id: ID, type: T, options?: Options): Infer<ID, T, Options>;

export function infer(
  ...args: [string, InferOptions?] | [string, string, InferOptions?]
): Infer {
  if (typeof args[1] === "string") {
    const [id, type, options] = args as [string, string, InferOptions?];
    return {
      [Expr]: "infer",
      id,
      type,
      options,
    } as const;
  } else {
    const [id, options] = args as [string, InferOptions?];
    return {
      [Expr]: "infer",
      id,
      type: "string",
      options,
    } as const;
  }
}
