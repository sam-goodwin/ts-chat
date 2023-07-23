import { chat } from "ts-chat";

await chat(
  {
    /**
     * Adds two numbers
     *
     * @param a first argument
     * @param b second arguments
     * @returns the sum of a and b
     */
    add(a: number, b: number) {
      return a + b;
    },
    minus,
  },
  {
    messages: [],
  }
);

/**
 * Subtracts two numbers
 * @param a first argument
 * @param b second argument
 * @returns a - b
 */
function minus(a: number, b: number): number {
  return a - b;
}
