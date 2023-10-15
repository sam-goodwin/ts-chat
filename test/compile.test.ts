import { AI, LLM, assistant, slot, $, system, user } from "../src/index.js";

const ai = new AI();

const color = slot("color", "'brown'|'red'");
const animal = slot("animal", "'fox'|'dog'|'cat'");
const obstacle = slot("obstacle", "'lazy dog'|'fence'|'wall'");

const nurseryRhyme = ai.compile`The quick ${color} ${animal} jumped over the ${obstacle}.`;

{
  const { color, animal, obstacle } = await nurseryRhyme();
  if (animal === "") {
  }
}

const createPerson = ai.compile`

${assistant`The following is a character profile for an RPG game in JSON format.

Person:
\`\`\`json
{
  "id": "${$("id")}",
  "description": "${$("description")}",
  "name": "${slot("name", "string|number")}",
  "age": ${slot("age", "integer")},
}
\`\`\`
`}

${user`Age of the person is: ${$("age")}`}`;

const r = await createPerson({
  id: "123",
  description: "A person",
});
r.name;

const experts = await ai.compile`

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
`({
  query: "What is the meaning of life?",
});
