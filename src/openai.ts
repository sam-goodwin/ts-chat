import { OpenAI } from "openai";
import { LLM } from "./client.js";

export class OpenAIChatModel implements LLM {
  constructor(readonly client: OpenAI) {}

  public async complete() {
    const stream = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [],
      stream: true,
      // bias tokens
      logit_bias: {
        '"': 100,
      },
    });

    for await (const message of stream) {
      message.choices[0].delta.content;
    }
  }
}

export class OpenAICompletionModel implements LLM {
  constructor(readonly client: OpenAI) {}

  public async complete() {
    const stream = await this.client.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: "",
      stream: true,
      logit_bias: {
        '"': 100,
      },
      logprobs: 3,
    });

    for await (const message of stream) {
      message.choices[0];
    }
  }
}
