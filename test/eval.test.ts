import type { Eval, Slot, $ } from "../src/index.js";

type Person = Eval<{
  id: $<"id", "uuid">;
  description: $<"description", "string">;
  name: Slot<undefined, "string">;
  age: Slot<"integer", "integer">;
}>;

type Person2 = Eval<{
  id: $<undefined, "uuid">;
  description: $<undefined, "string">;
  name: Slot<undefined, "string">;
  age: Slot<undefined, "integer">;
}>;

declare const person: Person;
declare const person2: Person2;

function tests() {
  // @ts-expect-error
  person.description;
  // @ts-expect-error
  person.id;
  person.name;
  person.integer;
  // @ts-expect-error
  person.age;

  // @ts-expect-error
  person2.description;
  // @ts-expect-error
  person2.id;
  person2.name;
  person2.age;
}
