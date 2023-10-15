import type { type, valueOf } from "../type.js";

export declare function useSlot<Type extends type = "string">(
  type?: Type
): { value: valueOf<Type>; set: (value: valueOf<Type>) => void };
