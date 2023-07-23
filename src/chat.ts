import type { JSONSchema7 } from "json-schema";

export type Role = "assistant" | "function" | "system" | "user";

export interface Message {
  role: Role;
  content: string;
  name?: string;
}

export interface ChatFunctions {
  [functionName: string]: (...args: any[]) => any;
}

export interface ChatOptions {
  messages: Message[];
}

export type ChatFunctionsSpec<F extends ChatFunctions> = {
  [name in keyof F]: ChatFunctionSpec<name>;
};

export interface ChatFunctionSpec<Name = string> {
  parameterNames: string[];
  schema: {
    name: Name;
    description?: string;
    parameters: JSONSchema7 & {
      type: "object";
    };
  };
}

export async function chat<F extends ChatFunctions>(
  functions: F,
  options: ChatOptions,
  getSpec?: () => ChatFunctionsSpec<F>
) {
  assertSpec(getSpec);
  const spec = getSpec();
  // TODO:
}

export type ChatFunction<F extends (...args: any[]) => any> = F & {
  spec: ChatFunctionSpec;
};

chat.function = function <F extends (...args: any[]) => any>(
  func: F,
  getSpec?: () => ChatFunctionSpec<F>
) {
  assertSpec(getSpec);
  const spec = getSpec();
  Object.assign(func, spec);
  return func as F & {
    spec: ChatFunctionSpec;
  };
};

function assertSpec<T>(spec: T): asserts spec is Exclude<T, undefined> {
  if (spec === undefined) {
    throw new Error(
      `spec is required - either explicitly provide it or use the ts-chat compiler plugin`
    );
  }
}
