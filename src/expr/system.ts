import type { Turn } from "./turn.js";

export declare function system<E extends any[]>(
  template: TemplateStringsArray,
  ...expr: E
): Turn<E, "system">;

export declare function system<E extends any[]>(...expr: E): Turn<E, "system">;
