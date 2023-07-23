export type Role = "assistant" | "function" | "system" | "user";

export interface Message {
  role: Role;
  content: string;
  name?: string;
}

export type ChatFunction = (...args: any[]) => any;

export interface ChatFunctions {
  [functionName: string]: ChatFunction;
}

export interface ChatOptions {
  messages: Message[];
}

export async function chat<F extends ChatFunctions>(
  functions: F,
  options: ChatOptions
) {
  //
}
