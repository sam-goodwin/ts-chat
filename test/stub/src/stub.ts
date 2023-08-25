import { assistant, user, ChatClient, chat, int, timestamp } from "ts-chat";

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
      list(strings: string[]) {
        return "foo";
      },
    },
    {
      messages: [
        //
        user`Hello, I am a user`,
        sam`Hello, I am an assistant`,
      ],
    }
  );
}

const sam = assistant("Sam");

/**
 * Subtracts two numbers
 * @param a first argument
 * @param b second argument
 * @returns a - b
 */
function minus(a: Nat, b: number): number {
  return a - b;
}
