import axios from "axios";
import { getEncoding } from "js-tiktoken";
import type { JSONSchema7 } from "json-schema";
import {
  OpenAIApi,
  Configuration as OpenAIConfiguration,
  type ChatCompletionRequestMessage,
  type ChatCompletionResponseMessage,
  type CreateChatCompletionRequestStop,
  type CreateChatCompletionResponse,
  type CreateChatCompletionResponseChoicesInner,
  type ConfigurationParameters as OpenAIConfigurationProps,
} from "openai";
import type { Readable, Writable } from "stream";
import type { ChatMessage } from "./message.js";

export type ChatFunctionHandler = (
  this: { messages: ChatMessage[] },
  ...args: any[]
) => any;

export type ChatFunction<F extends ChatFunctionHandler = ChatFunctionHandler> =
  F & {
    spec: ChatFunctionSpec;
  };

export function isChatFunction(
  func: ChatFunctionHandler
): func is ChatFunction {
  return "spec" in func;
}

export interface ChatFunctions {
  [functionName: string]: ChatFunctionHandler;
}

export type ChatFunctionsSpec<F extends ChatFunctions> = {
  [name in keyof F]: ChatFunctionSpec;
};

/**
 * The OpenAI Function schema.
 *
 * @see https://platform.openai.com/docs/api-reference/chat/create#chat/create-functions
 */
export interface ChatFunctionSpec {
  /**
   * The names of the parameters in order as they appear in the function
   * declaration.
   *
   * E.g.
   * ```ts
   * function foo(a, b, c) {}
   * ```
   *
   * Here, the parameter names will be `["a", "b", "c"]`.
   */
  parameterNames: string[];
  /**
   * Flag indicating whether the last parameter is a rest parameter.
   *
   * E.g.
   * ```ts
   * function foo(a, b, ...c) {}
   * ```
   *
   * Here, the `c` parameter will be returned as an array from OpenAI but needs
   * to be spread into the call to `foo`.
   *
   * @default false
   */
  rest?: boolean;
  /**
   * Name of the function.
   *
   * Must be unique in the context of a single function call.
   */
  name: string;
  /**
   * Description of the function. Used by OpenAI's LLM to determine which
   * function to call.
   *
   * @default - no description
   */
  description?: string;
  /**
   * An `"object"` JSON schema definition where each property corresponds
   * to a single parameter.
   *
   * The property name is the parameter name.
   *
   * The property value is the JSON schema for the parameter derived from
   * the TypeScript type and comments of the parameter.
   */
  parameters: JSONSchema7 & {
    type: "object";
  };
}

export interface ChatFunctionSchema {}

/**
 * Input properties to the {@link chat} function.
 *
 * It configures the chat completion request to OpenAI.
 */
export interface ChatInput<
  Functions extends ChatFunctions | undefined = undefined,
> {
  /**
   * The chat messages.
   */
  messages: ChatMessage[];
  /**
   * True if the chat should be printed to stdout.
   *
   * Also accepts a writable stream to write the chat to.
   *
   * @default false
   */
  output?: boolean | Writable;
  /**
   * The maximum number of tokens to generate.
   *
   * @default 1024
   */
  maxTokens?: number;
  /**
   * The GPT model to use.
   *
   * @default "gpt-4"
   */
  model?: string;
  /**
   * The number of completions to generate for each prompt.
   *
   * @default 1
   */
  n?: number;
  /**
   * The temperature to use for sampling, between 0 and 1.
   *
   * @default 0.0
   */
  temperature?: number;
  /**
   * The stop token to halt generation on.
   */
  stop?: CreateChatCompletionRequestStop;

  /**
   * Controls how the model responds to function calls.
   *
   * "none" means the model does not call a function, and responds to the end-user.
   * "auto" means the model can pick between an end-user or calling a function.
   * Specifying a particular function via `{name:\ "my_function"}` forces the model to call that function.
   * "none" is the default when no functions are present.
   * "auto" is the default if functions are present.
   *
   * @see https://platform.openai.com/docs/api-reference/chat/create#chat/create-function_call
   */
  functionCall?: FunctionCallConfig<Functions> | undefined;
}

export type ChatResponse<Functions extends ChatFunctions> =
  ChatMessage<Functions>;

/**
 * Thrown when a request to OpenAI times out.
 */
export class TimeoutError extends Error {}

/**
 * Thrown when a chat request is cancelled during processing or streaming.
 *
 * A partial response may be returned if chat was steaming while aborted.
 * The partial response may contain partial function arguments.
 */
export class Cancelled extends Error {
  constructor(
    message: string = "Chat Cancelled",
    public partialResponse?: ChatCompletionResponseMessage
  ) {
    super(message);
  }
}

export type FunctionCallConfig<
  Functions extends ChatFunctions | undefined,
  FunctionName extends Extract<keyof Functions, string> = Extract<
    keyof Functions,
    string
  >,
> =
  | "auto"
  | "none"
  | {
      name: FunctionName;
    };

export interface ChatClientOptions extends OpenAIConfigurationProps {}

const __ts_chat = Symbol.for("ts-chat");

export class ChatClient {
  /**
   * Unique identifier to signal to the ts-chat/plugin that this is the actual
   * chat client. This improves the heuristics to detect the chat client.
   */
  readonly __ts_chat = __ts_chat;

  /**
   * A reference to the OpenAI API client.
   */
  readonly openai;

  constructor(readonly options: ChatClientOptions) {
    this.openai = new OpenAIApi(new OpenAIConfiguration(options));
  }

  public async chat<F extends ChatFunctions>(
    functions: F,
    options: ChatInput<F>,
    getSpec?: () => ChatFunctionsSpec<F>
  ): Promise<ChatResponse<F>> {
    assertSpec(getSpec);
    const functionSpecs = getSpec();
    const response = await this.chatCompletion<F>({
      ...options,
      functions: functionSpecs,
    });

    if (response.function_call === undefined) {
      // terminal assistant response
    } else {
      const func = functions[response.function_call.name];
      const funcSpec = isChatFunction(func)
        ? func.spec
        : functionSpecs[response.function_call.name];
      if (!func || !funcSpec) {
        throw new Error(
          `OpenAI called function ${response.function_call.name} but it was not defined.`
        );
      }
      const args = JSON.parse(response.function_call.arguments);
      // TODO: validate args against the JSON schema

      if (typeof args === "object") {
        const argValues = funcSpec.parameterNames.flatMap((name, i) => {
          const argValue = args[name];
          const isLast = i === funcSpec.parameterNames.length - 1;
          if (isLast && funcSpec.rest && Array.isArray(argValue)) {
            // because of 'flatMap', this will spread into the call
            return argValue;
          }
          return [argValue];
        });
        const messages = [...options.messages, response];
        const functionCallResult = await func.bind({
          messages,
        })(...argValues);

        // TODO: implement stop logic

        return this.chat(functions, {
          ...options,
          messages: [
            ...messages,
            {
              role: "function",
              name: response.function_call.name,
              content: JSON.stringify(functionCallResult),
            },
          ],
        });
      } else {
        throw new Error(`Expected an object, got ${typeof args}`);
      }
    }
    return response;
  }

  /**
   * Execute a chat completion request.
   *
   * @param props The chat completion request.
   * @param attemptsLeft The number of attempts left to retry.
   * @param backoffMs The number of milliseconds to backoff before retrying.
   * @param abortSignal The abort signal to abort the request and throw {@link Cancelled}.
   *                    A partial response may be present in the {@link Cancelled} error.
   * @returns The chat completion response.
   * @throws TimeoutError if the request times out.
   */
  protected async chatCompletion<Functions extends ChatFunctions>(
    props: ChatInput<Functions> & {
      functions?: ChatFunctionsSpec<Functions>;
    },
    options?: {
      attemptsLeft?: number;
      backoffMs?: number;
      abortSignal?: AbortSignal;
    }
  ): Promise<ChatResponse<Functions>> {
    const messages = props.messages;
    const abortController = new AbortController();
    const {
      attemptsLeft = 20,
      backoffMs = 2000,
      abortSignal: userAbortSignal,
    } = options ?? {};

    // combine the user abort signal with the internal abort signal
    if (userAbortSignal) {
      // if the user signal is already triggered, return an empty response.
      if (userAbortSignal.aborted) {
        return { role: "assistant", content: "" } as ChatResponse<Functions>;
      } else {
        userAbortSignal.addEventListener(
          "abort",
          () => {
            abortController.abort(userAbortSignal.reason);
          },
          { signal: abortController.signal }
        );
      }
    }

    try {
      const totalTokens = countTokens(JSON.stringify(props.messages));
      let maxTokens = props?.maxTokens ?? 1024;
      if (maxTokens + totalTokens > 7900) {
        const _maxTokens = 7900 - totalTokens;
        if (_maxTokens <= 0) {
          throw new Error("not enough tokens");
        }
        maxTokens = _maxTokens;
      }

      const stream = !!props.output; // stream is truthy

      const completion = await this.openai.createChatCompletion(
        {
          // TODO: change the specific version to the latest version once updated
          model: props?.model ?? "gpt-4-0613",
          messages: messages.map((msg) => toRawChatMessage(msg)),
          temperature: props?.temperature ?? 0,
          max_tokens: props?.maxTokens ?? 1024,
          n: props?.n ?? 1,
          top_p: 1,
          stream,
          stop: props.stop,
          functions: props.functions
            ? Object.values(props.functions).map(
                ({ name, description, parameters }) => ({
                  name,
                  description,
                  parameters,
                })
              )
            : undefined,
          function_call: props.functionCall,
        },
        {
          responseType: stream ? "stream" : undefined,
          signal: abortController.signal,
        }
      );

      const response = !stream
        ? completion.data
        : await streamChatResponse(
            completion.data as unknown as Readable,
            typeof props.output === "boolean"
              ? process.stdout
              : (props.output as Writable),
            abortController.signal
          );

      const _message = response.choices[0]?.message!;

      if (_message.function_call && !_message.function_call.arguments) {
        throw new Error(
          "Expected function call arguments to be defined:" +
            JSON.stringify(_message.function_call)
        );
      }

      const message: ChatMessage = _message.function_call
        ? ({
            ..._message,
            function_call: {
              name: _message.function_call.name!,
              arguments: _message.function_call.arguments!,
              payload: JSON.parse(_message.function_call.arguments!),
            },
          } satisfies ChatMessage)
        : (_message as ChatMessage);

      return message as ChatResponse<Functions>;
    } catch (err: any) {
      // cancel is only thrown when output is falsy and the abort signal is triggered.
      if (axios.isCancel(err)) {
        throw new Cancelled();
      } else if (err instanceof Cancelled) {
        throw err;
      } else if (canRetry(err) && attemptsLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.chatCompletion(props, {
          attemptsLeft: attemptsLeft - 1,
          backoffMs: Math.min(30000, backoffMs * 2),
          abortSignal: abortController.signal,
        });
      }
      const tokens = countTokens(messages.map((m) => m.content).join("\n"));
      console.log(`${err.response?.status}`);
      console.log(tokens);
      throw new Error(`chat failed`, {
        cause: err,
      });
    }

    function canRetry(err: any) {
      const canRetry =
        err instanceof TimeoutError ||
        err.response?.status === 429 ||
        err.response?.status >= 500 ||
        err.code === "ECONNRESET";
      return canRetry;
    }
  }
}

function toRawChatMessage(
  message: ChatMessage<any>
): ChatCompletionRequestMessage {
  return {
    role: message.role,
    content: message.content || "",
    name: message.name,
    function_call: message.function_call
      ? {
          name: message.function_call.name,
          arguments: message.function_call.arguments,
        }
      : undefined,
  };
}

export const chat = {
  __ts_chat,
  function: function <F extends (...args: any[]) => any>(
    func: F,
    getSpec?: () => ChatFunctionSpec
  ): F & {
    spec: ChatFunctionSpec;
  } {
    assertSpec(getSpec);
    const spec = getSpec();
    Object.assign(func, {
      spec,
      __ts_chat,
    });
    return func as any;
  },
};

function assertSpec<T>(spec: T): asserts spec is Exclude<T, undefined> {
  if (spec === undefined) {
    throw new Error(
      `spec is required - either explicitly provide it or use the ts-chat compiler plugin`
    );
  }
}

const gpt4 = getEncoding("cl100k_base");

export function countTokens(str: string) {
  return gpt4.encode(str).length;
}

async function streamChatResponse(
  chatStreamResponse: Readable,
  toStream: Writable,
  abortSignal: AbortSignal
): Promise<CreateChatCompletionResponse> {
  return new Promise<CreateChatCompletionResponse>((resolve, reject) => {
    const messageParts: CreateChatCompletionStreamResponse[] = [];

    let firstByteReceived = false;

    const timeout = setTimeout(() => {
      if (!firstByteReceived) {
        debugger;
        const msg = "Did not receive response within 10 seconds, retrying.";
        chatStreamResponse.destroy();
        reject(new TimeoutError(msg));
      }
    }, 10000);

    const finalize = () => {
      firstByteReceived = true;
      clearTimeout(timeout);
      write("\n");
      const merged = mergeMessageParts(messageParts);
      return merged;
    };

    // openAPI's stream response doesn't respect the abort signal, so we have to do it ourselves
    abortSignal.addEventListener("abort", () => {
      chatStreamResponse.destroy();
      // end back whatever we have so far.
      const result = finalize();
      reject(
        new Cancelled(
          "Chat Cancelled while streaming",
          result.choices[0]?.message
        )
      );
    });

    chatStreamResponse.on("end", () => {
      resolve(finalize());
    });

    chatStreamResponse.on("data", (data: Buffer) => {
      firstByteReceived = true;
      clearTimeout(timeout);
      const parts = data
        .toString("utf8")
        .split("\n")
        .filter((line) => line.trim().startsWith("data: "))
        .flatMap((line) => parseToken(line) ?? []);
      const content = parts
        .flatMap((p) => p.choices[0]?.delta.content)
        .join("");
      if (content) {
        write(content);
      }
      messageParts.push(...parts);
    });
  });

  function write(content: string) {
    toStream.write(content);
  }

  function parseToken(
    line: string
  ): CreateChatCompletionStreamResponse | undefined {
    const message = line.replace(/^data: /, "");
    if (message === "[DONE]") {
      return undefined;
    }

    return JSON.parse(message) as CreateChatCompletionStreamResponse;
  }

  function mergeMessageParts(
    parts: CreateChatCompletionStreamResponse[]
  ): CreateChatCompletionResponse {
    if (parts.length === 0) {
      throw new Error("Expected at least one message part");
    }
    const { id, model, created, object } = parts[0]!;
    const message: CreateChatCompletionResponseChoicesInner = {};
    for (const part of parts) {
      if (part.id !== id) {
        throw new Error(
          "Expected all stream message parts to have the same id."
        );
      }
      const [firstChoice] = part.choices;
      if (!firstChoice) {
        continue;
      }
      message.index ??= firstChoice.index;
      message.finish_reason ??= firstChoice.finish_reason;
      if (!message.message) {
        message.message = firstChoice.delta as ChatCompletionResponseMessage;
      } else {
        message.message.role = firstChoice.delta.role ?? message.message.role;
        message.message.content =
          (message.message.content ?? "") + (firstChoice.delta.content ?? "");
        if (firstChoice.delta.function_call) {
          if (message.message.function_call) {
            message.message.function_call.arguments +=
              firstChoice.delta.function_call.arguments ?? "";
            message.message.function_call.name =
              firstChoice.delta.function_call.name ??
              message.message.function_call.name;
          } else {
            message.message.function_call = firstChoice.delta.function_call;
          }
        }
      }
    }
    return {
      id,
      model,
      created,
      object,
      choices: [message],
    };
  }
}

interface CreateChatCompletionStreamResponseChoicesInner
  extends Omit<CreateChatCompletionResponseChoicesInner, "message"> {
  delta: Partial<ChatCompletionResponseMessage>;
}

interface CreateChatCompletionStreamResponse
  extends Omit<CreateChatCompletionResponse, "usage" | "choices"> {
  choices: CreateChatCompletionStreamResponseChoicesInner[];
}
