import type { Type } from "arktype";
import type { inferDefinition } from "arktype/internal/parse/definition.js";
import type { PrecompiledDefaults } from "arktype/internal/scopes/ark.js";

const Guidance = Symbol.for("ts-chat.Guidance");

type Gen<ID extends string = string, T extends string | Type = any> = {
  [Guidance]: "gen";
  id: ID;
  type: T;
  [props: string]: any;
};

export function gen<ID extends string, T extends string | Type = "string">(
  id: ID,
  type: T,
  options?: {
    pattern?: RegExp;
    stop?: string;
  }
): Gen<ID, T> {
  return {
    [Guidance]: "gen",
    id,
    type,
    ...(options ?? {}),
  };
}

type Ref<ID extends string = string> = {
  [Guidance]: "ref";
  id: ID;
};

function ref<ID extends string>(id: ID): Ref<ID> {
  return {
    [Guidance]: "ref",
    id,
  };
}

// TODO: design and implement
function select() {}

type Guidance<Input, Output> = (input: Input) => Promise<Output>;

type IDs<T extends any[]> = {
  [i in keyof T]: T[i] extends Gen<infer ID> | Ref<infer ID> ? ID : never;
}[keyof T];

type Refs<T extends any[]> = Extract<T[number], Ref>;
type Gens<T extends any[]> = Extract<T[number], Gen>;

// a tagged template string function, guidance
export declare function guidance<T extends any[]>(
  strings: TemplateStringsArray,
  ...values: T
): (
  input: {
    // references must be passed in
    // TODO: is this true? Unclear why these need to be parameterized in the template instead of using ordinary JS interpolation
    // e.g. `${id}` instead of `${ref("id")}`
    [k in Refs<T>["id"]]: any;
  } & {
    // generated values can be passed in optionally
    [k in Gens<T>["id"]]?: any;
  }
) => Promise<{
  [i in keyof T as T[i] extends Gen<infer ID> ? ID : never]: T[i] extends Gen<
    any,
    infer U
  >
    ? U extends Type<infer V>
      ? V
      : inferDefinition<U, PrecompiledDefaults>
    : never;
}>;

const program = guidance`The following is a character profile for an RPG game in JSON format.
\`\`\`json
{
  "id": "${ref("id")}",
  "description": "${ref("description")}",
  "name": "${gen("name", "string")}",
  "age": ${gen(
    "age",
    "integer",
    // TODO: we should be able to infer this from the type
    { pattern: /[0-9]+/, stop: "," }
  )}
}
\`\`\``;

const { age, name } = await program({
  id: "id",
  description: "description",
  age: 1,
});
