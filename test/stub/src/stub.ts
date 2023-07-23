import { chat } from "type-chain";

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
  },
  {
    messages: [],
  }
);
