import { Kind } from "./expr.js";
import { type } from "./type.js";

type SlotOptions = {
  stop?: string;
  temperature?: number;
  maxTokens?: number;
};

export type Slot<ID extends string = string, T extends type = any> = {
  [Kind]: "slot";
  id: ID;
  type: T;
  options: SlotOptions | undefined;
};

export function slot<const ID extends string, const T extends type = "string">(
  id: ID,
  type?: T,
  options?: SlotOptions
): Slot<ID, T> {
  return {
    [Kind]: "slot",
    id,
    type: (type ?? "string") as T,
    options,
  } as const;
}
