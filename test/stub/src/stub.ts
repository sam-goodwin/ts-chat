import { ChatClient, chat, int, timestamp } from "ts-chat";
import { assistant, user } from "../../../src/message.js";

const client = new ChatClient({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const sym = Symbol.for("ts");

/**
 * @min 1
 */
type Nat = number;

/**
 * A Person
 */
interface Person {
  /**
   * @minLength 3
   * @pattern ^[a-zA-Z]+$
   */
  name: string;
}

export const myFunc = chat.function(minus);

export async function main() {
  await client.chat(
    {
      myFunc,
      /**
       * Adds two numbers
       *
       * @param a
       * @param b second arguments
       * @returns the sum of a and b
       */
      add(
        /**
         * first argument
         */
        a: int,
        /**
         * @min 2
         */
        b: Nat
      ) {
        return a + b;
      },
      minus,
      getMonth(time: timestamp) {
        return time;
      },
      hello(person: Person, message: string) {
        return `Hello ${person.name}, ${message}`;
      },
    },
    {
      messages: [
        //
        user`Hello, I am a user`,
        assistant("name")`Hello, I am an assistant`,
      ],
    }
  );
}

/**
 * Subtracts two numbers
 * @param a first argument
 * @param b second argument
 * @returns a - b
 */
function minus(a: Nat, b: number): number {
  return a - b;
}
