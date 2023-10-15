import { arrayOf, type } from "arktype";
import {
  $,
  AI,
  Each,
  Slot,
  Turn,
  assistant,
  compile,
  json,
  slot,
  system,
  user,
} from "../src/index.js";

const ai = new AI();

const color = slot("color", "'brown'|'red'");
const animal = slot("animal", "'fox'|'dog'|'cat'");
const obstacle = slot("obstacle", "'lazy dog'|'fence'|'wall'");

const nurseryRhyme = ai.compile`The quick ${color} ${animal} jumped over the ${obstacle}.`;

{
  const { color, animal, obstacle } = await nurseryRhyme();
  // @ts-expect-error
  if (animal === "") {
  }
}

const Entity = type({
  entity: "string",
  time: "string",
});

const Sample = slot(
  "sample",
  type({
    input: "string",
    entities: arrayOf(Entity),
    answer: "'yes'|'no'",
    reasoning: "string",
  })
);

const createPerson = ai.compile`Given a sentence tell me whether it contains an anachronism (i.e. whether it could have happened or not based on the time periods associated with the entities).
----
${Sample.map((sample) => ({
  Sentence: sample.input,
  "Entities and Dates\n": sample.entities,
  Reasoning: sample.reasoning,
  Anachronism: sample.answer,
}))}

${assistant`The following is a character profile for an RPG game in JSON format.

Person:
${json({
  id: $("id"),
  description: $("description"),
  name: slot("name", "string|number"),
  age: slot("age", "integer"),
})}
`}

${user`Age of the person is: ${$("age")}`}`;

const { age, name } = await createPerson({
  id: "some id",
  description: "the description",
});

const experts = ai.compile`

${system`You are a helpful and terse assistant.`}

${user`I want a response to the following question:
${$("query", "string")}`}

${assistant`${slot("expert_names", "string", {
  temperature: 0,
  maxTokens: 300,
})}`}

${user`Great, now please answer the question as if these experts had collaborated in writing a joint anonymous answer.`}

${assistant`${slot("answer", "string", {
  temperature: 0,
  maxTokens: 500,
})}`}
`;

const { answer, expert_names } = await experts({
  query: "What is the meaning of life?",
});

type program = [
  Turn<[$<"i">]>,
  Slot<"foo", "string">,
  $<"foo">,
  Turn<[$<"bar">]>,
  Each<{
    input: $<"input">;
    key: $<"list">;
  }>,
  // Json<{
  //   key: Infer<"key", "string">;
  // }>,
];

type out = compile<program>;
declare const out: out;
out.input.i;
out.input.bar;
out.input.input;
out.output.foo;

type compiled = compile<program>;
declare const compiled: compiled;
compiled.input.bar;
compiled.output.foo;
compiled.names.bar;
compiled.names.foo;

type prog2 = [
  Slot<"color", "'brown'|'red'">,
  Slot<"animal", "'fox'|'dog'|'cat'">,
  Slot<"obstacle", "'lazy dog'|'fence'|'wall'">,
];

type out2 = compile<prog2>;

type out3 = compile<
  [
    Each<{
      Sentence: string;
      // "Entities and Dates\n": Each<
      //   {
      //     entity: string;
      //     time: string;
      //   },
      //   any
      // >;
      Reasoning: string;
      Anachronism: "no" | "yes";
    }>,
  ]
>;

type out4 = compile<
  [Each<Turn<[string, Each<$<"foo">>, string, "no" | "yes"], undefined>>]
>;

type out5 = compile<[Turn<[string, string, $<"foo", "string">], undefined>[]]>;
