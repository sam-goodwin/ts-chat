import { Type } from "arktype";
import type { inferDefinition } from "arktype/internal/parse/definition.js";
import type { PrecompiledDefaults } from "arktype/internal/scopes/ark.js";

export type type = Type | string;

export type valueOf<T extends type> = T extends Type<infer V>
  ? V
  : inferDefinition<T, PrecompiledDefaults>;
