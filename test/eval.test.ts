import type { Eval, Infer, Input } from "../src/index.js";

type Person = Eval<{
  id: Input<"id", "uuid">;
  description: Input<"description", "string">;
  name: Infer<undefined, "string">;
  age: Infer<"integer", "integer">;
}>;

type Person2 = Eval<{
  id: Input<undefined, "uuid">;
  description: Input<undefined, "string">;
  name: Infer<undefined, "string">;
  age: Infer<undefined, "integer">;
}>;

declare const person: Person;
declare const person2: Person2;

function tests() {
  person.description;
  person.id;
  person.name;
  person.integer;

  person2.description;
  person2.id;
  person2.name;
  person2.age;
}
