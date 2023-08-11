# ts-chat

`ts-chat` is a TypeScript plugin that adds support for generating OpenAI's GPT Functions from native TypeScript functions, types and comments.

```ts
import { ChatClient, system, user } from "ts-chat";

const client = new ChatClient({
  apiKey: process.env.OPEN_AI_KEY,
});

await client.chat(
  {
    /**
     * Adds two numbers.
     *
     * @param a the first number
     * @param b the second number
     */
    add: (a: number, b: number) => a + b,
  },
  {
    messages: [
      system`You are a calculator.`,
      user`what is the sum of 1 and 2?`,
    ],
  }
);
```

## Installation

First, install `ts-chat`:

```
npm install ts-chat
```

Next, you need to configure [`ts-patch`](https://github.com/nonara/ts-patch) to enable plugin support in the TypeScript compiler and configure the `ts-chat/plugin`.

There are two options for this set up:

1. permanently patch using the NPM `prepare` script
2. patch when you run (e.g. when running `ts-node`, `tsc`, `jest`, etc.)

### Option 1 - permanently patch

Run the `setup` script to install `ts-patch`, configure `prepare` and install `ts-chat/plugin` in `tsconfig.json`

```
npx ts-chat setup
```

This script performs the following steps:

1. Installs `ts-node` and `ts-patch`
2. Add the `prepare` script to your `package.json` to run the `ts-patch install` whenever you install dependencies:

```json
"scripts": {
  "prepare": "ts-patch install"
}
```

3. Add the `ts-chat/plugin` to your `tsconfig.json` - without this, the `chat` function can not receive the JSON schema and descriptions of your functions.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "ts-chat/plugin"
      }
    ]
  }
}
```

### Option 2 - "Live Compiler"

From `ts-patch`'s documentation on ["Live Compilation"](https://github.com/nonara/ts-patch#method-1-live-compiler):

> The live compiler patches on-the-fly, each time it is run.
>
> Via commandline: Simply use `tspc` (instead of `tsc`)
>
> With tools such as `ts-node`, `webpack`, `ts-jest`, etc: specify the compiler as ts-patch/compiler

## How it Works

Functions are converted into their corresponding OpenAI Function definition:

```json
{
  "name": "add",
  "description": "Adds two numbers",
  "parameters": {
    "type": "object",
    "properties": {
      "a": { "type": "number", "description": "first argument" },
      "b": { "type": "number", "description": "second arguments" }
    }
  }
}
```

The `description`s are derived from the typedoc comments and the `parameters` JSON schema is derived from the types of the Function's arguments.
