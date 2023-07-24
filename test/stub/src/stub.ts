import { ChatClient, chat, int } from "ts-chat";

const client = new ChatClient({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const sym = Symbol.for("ts");

/**
 * @min 1
 */
type Nat = number;

export async function main() {
  await client.chat(
    {
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
    },
    {
      messages: [],
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

export const myFunc = chat.function(minus);
