import {
  assistant,
  infer,
  input,
  json,
  compile,
  system,
  user,
  Eval,
} from "../src/index.js";

const j = json({
  id: input("id", "uuid"),
  "description?": input("description", "string"),
  name: infer("string"),
  age: infer("integer"),
});

type A = Eval<typeof j>;

const program = compile`The following is a character profile for an RPG game in JSON format.

Person:
${json({
  id: input("uuid"),
  description: input("string"),
  name: infer("string"),
  age: infer("integer"),
})}`;

const {} = await program({});

const experts = compile`
${system`You are a helpful and terse assistant.`}

${user`I want a response to the following question:
${input("query", "string")}`}

${assistant`${infer("expert_names", "string", {
  temperature: 0,
  maxTokens: 300,
})}`}

${user`Great, now please answer the question as if these experts had collaborated in writing a joint anonymous answer.`}

${assistant`${infer("answer", {
  temperature: 0,
  maxTokens: 500,
})}`}
`;
