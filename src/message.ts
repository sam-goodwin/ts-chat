import { ChatFunctions } from "./chat.js";

export type ChatRole = "assistant" | "function" | "system" | "user";

export interface ChatMessage<
  Functions extends ChatFunctions | undefined = any,
> {
  role: ChatRole;
  content?: string | null;
  name?: string;
  function_call?: {
    [FunctionName in Extract<keyof Functions, string>]: FunctionCall<
      Functions,
      FunctionName
    >;
  }[Extract<keyof Functions, string>];
}

type FunctionCall<
  Functions extends ChatFunctions | undefined,
  FunctionName extends Extract<keyof Functions, string> = Extract<
    keyof Functions,
    string
  >,
> = Functions extends undefined
  ? never
  : {
      name: FunctionName;
      arguments: string;
      payload: any;
    };

export const user = createRoleFunction("user");
export const assistant = createRoleFunction("assistant");
export const system = createRoleFunction("system");

function createRoleFunction(role: ChatRole, name?: string) {
  type Message = {
    role: ChatRole;
    content: string;
    name: string;
  };

  return user;

  function user(
    name: string
  ): (strings: TemplateStringsArray, ...values: any[]) => Message;

  function user(strings: TemplateStringsArray, ...values: any[]): Message;

  function user(
    ...args: [name: string] | [strings: TemplateStringsArray, ...values: any[]]
  ) {
    if (typeof args[0] === "string") {
      if (name !== undefined) {
        throw new Error("Cannot specify name twice");
      }
      return createRoleFunction(role, args[0]) as (
        strings: TemplateStringsArray,
        ...values: any[]
      ) => Message;
    }
    const [strings, ...values] = args;
    const content = strings
      .map((string, index) => `${string}${values[index] || ""}`)
      .join("");
    return {
      role,
      content,
      name,
    } as Message;
  }
}
