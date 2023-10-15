import React from "react";
import { arrayOf, type } from "arktype";
import {
  $,
  Assistant,
  Json,
  Slot,
  slot,
  System,
  useSlot,
} from "../src/jsx/index.js";

const Entity = type({
  entity: "string",
  time: "string",
});

const Samples = arrayOf(
  type({
    input: "string",
    entities: arrayOf(Entity),
    answer: "'yes'|'no'",
    reasoning: "string",
  })
);

export const Person = ({ samples }: { samples: typeof Samples.infer }) => {
  const description = useSlot("string");

  // dang, this isn't typed
  const f = <Slot id={"id"} />;
  // this is, but it breaks the JSX concept
  const f2 = Slot({ id: "id" });

  return (
    <>
      <System>
        <p>
          Given a sentence tell me whether it contains an anachronism (i.e.
          whether it could have happened or not based on the time periods
          associated with the entities).
        </p>
        <ul>
          <li>Hello</li>
        </ul>
        <Json>
          {{
            id: description.value,
          }}
        </Json>
        {samples.map((sample) => (
          <>
            Sentence: {sample.input}
            Entities and Dates:
            <Json>{sample.entities}</Json>
            Reasoning: {sample.reasoning}
            Anachronism: {sample.answer}
            ---
          </>
        ))}
      </System>
      <Assistant>
        The following is a character profile for an RPG game in JSON format.
        Person:
      </Assistant>
    </>
  );
};
