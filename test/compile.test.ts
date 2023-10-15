import { arrayOf, type } from "arktype";
import { $, AI, assistant, json, slot, system, user } from "../src/index.js";

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

const Samples = $(
  "samples",
  arrayOf(
    type({
      input: "string",
      entities: arrayOf(Entity),
      answer: "'yes'|'no'",
      reasoning: "string",
    })
  )
);

const createPerson = ai.compile`
${system`
Given a sentence tell me whether it contains an anachronism (i.e. whether it could have happened or not based on the time periods associated with the entities).

Samples:
${Samples.map((sample) => ({
  Sentence: sample.input,
  "Entities and Dates\n": sample.entities,
  Reasoning: sample.reasoning,
  Anachronism: sample.answer,
}))}`}

${assistant`The following is a character profile for an RPG game in JSON format.

Person:
${json({
  id: $("id", "uuid"),
  description: $("description"),
  name: slot("name", "string|number"),
  age: slot("age", "integer"),
})}
`}`;

const createPerson2 = ai.compile(
  system`
Given a sentence tell me whether it contains an anachronism (i.e. whether it could have happened or not based on the time periods associated with the entities).

Samples:
${Samples.map((sample) => ({
  Sentence: sample.input,
  "Entities and Dates\n": sample.entities,
  Reasoning: sample.reasoning,
  Anachronism: sample.answer,
}))}`,

  assistant`The following is a character profile for an RPG game in JSON format.

Person:
${json({
  id: $("id", "uuid"),
  description: $("description"),
  name: slot("name", "string|number"),
  age: slot("age", "integer"),
})}
`
);

{
  [createPerson, createPerson2].map(async (createPerson) => {
    const { age, name } = await createPerson({
      id: "some id",
      description: "",
      samples: [
        {
          answer: "yes",
          entities: [
            {
              entity: "",
              time: "",
            },
          ],
          input: "",
          reasoning: "",
        },
      ],
    });
  });
}

const expertNames = slot("expertNames", "string", {
  temperature: 0,
  maxTokens: 300,
});

const answer = slot("answer", "string", {
  temperature: 0,
  maxTokens: 500,
});

const a = [
  //
  system`You are a helpful and terse assistant.`,
  user`I want a response to the following question:
${$("query", "string")}`,
  assistant`${expertNames}`,
  user`Great, now please answer the question as if these experts had collaborated in writing a joint anonymous answer.`,
  ``,
  assistant(answer),
];

const generateExperts = ai.compile`

${system`You are a helpful and terse assistant.`}

${user`I want a response to the following question:
${$("query", "string")}`}

${assistant`${expertNames}`}

${user`Great, now please answer the question as if these experts had collaborated in writing a joint anonymous answer.`}

${assistant`${slot("answer", "string", {
  temperature: 0,
  maxTokens: 500,
})}`}
`;

{
  const { answer, expertNames } = await generateExperts({
    query: "What is the meaning of life?",
  });
}
