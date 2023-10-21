import { OpenAI } from "openai";
import { encodingForModel } from "js-tiktoken";
import { LanguageGenerator } from "./interpreter/language-generator.js";
import { Slot, isSlot } from "./expr/slot.js";
import { isStringSlot } from "./expr/string.js";
import { Expr } from "./expr/expr.js";
import {
  isMatchSlot,
  isNumberSlot,
  isRepeatSlot,
  isSelectSlot,
} from "./index.js";
import { isRangeSlot } from "./expr/range.js";

const gpt3 = encodingForModel("gpt-3.5-turbo");

export interface LLMClient {}

export class AI {
  readonly openAI: OpenAI;

  constructor(
    readonly options: {
      apiKey: string;
    }
  ) {
    this.openAI = new OpenAI({
      apiKey: options.apiKey,
      timeout: 60_000,
    });
  }

  public async eval<T>(generator: () => LanguageGenerator<T>): Promise<T> {
    const gen = generator();
    let next;
    let slots: any[] | undefined = [];
    const prompt: string[] = [];
    while (!(next = gen.next(slots)).done) {
      const turn = next.value;
      const result = await this.evalTemplate(prompt, turn.template, turn.exprs);
      slots = result.slots;
      prompt.push(...result.prompt);
    }
    return next.value as T;
  }
  async evalTemplate(
    prompt: string[],
    template: string[],
    exprs: Expr[]
  ): Promise<{
    slots: any[];
    prompt: string[];
  }> {
    const self = this;
    const slots = [];
    for (let i = 0; i < template.length; i++) {
      const left = template[i];
      const right: string | undefined = template[i + 1];
      prompt.push(left);
      const expr = exprs[i];
      if (expr === undefined) {
        if (right) {
          prompt.push(right);
        }
        return {
          slots,
          prompt,
        };
      }
      if (isSlot(expr)) {
        const stream = await this.openAI.completions.create({
          model: "gpt-3.5-turbo-instruct",
          prompt: prompt.join(""),
          stream: true,
          stop: expr.options.stop ? [expr.options.stop].flat() : undefined,
          // TODO: add support for customizing these options
          n: 1,
          temperature: 0,
          max_tokens: 100,
          logit_bias: computeBias(expr),
        });

        slots.push(await evalSlot(expr));

        async function evalSlot(expr: Slot) {
          if (isStringSlot(expr)) {
            const result: string[] = [];
            stream: for await (const data of stream) {
              const text = data.choices[0].text;
              for (const c of text) {
                if (c === right?.[0]) {
                  break stream;
                }
                result.push(c);
              }
            }
            const val = result.join("");
            prompt.push(val);
            return val;
          } else if (isNumberSlot(expr) || isRangeSlot(expr)) {
            const chars: string[] = [];
            let dotReceived = false;
            for await (const data of stream) {
              const text = data.choices[0].text;
              if (dotReceived) {
                const [num, tail] = text.match(/^([0-9\.]+)(.*)/g) ?? [];
                if (num?.includes(".")) {
                  dotReceived = true;
                }
                if (!num) {
                  break;
                } else {
                  chars.push(num);
                }
                if (tail) {
                  break;
                }
              } else {
                const [num, tail] = text.match(/^([0-9]+)/g) ?? [];
                if (!num) {
                  break;
                } else {
                  chars.push(num);
                }
                if (tail) {
                  break;
                }
              }
            }
            const val = chars.join("");
            prompt.push(val);
            return Number(val);
          } else if (isSelectSlot(expr)) {
            const result: string[] = [];
            stream: for await (const data of stream) {
              const text = data.choices[0].text;
              for (const c of text) {
                result.push(c);
                if (expr.options.items.includes(result.join(""))) {
                  break stream;
                }
              }
            }
            const val = result.join("");
            prompt.push(val);
            return val;
          } else if (isMatchSlot(expr)) {
            let result: string[] = [];
            stream: for await (const data of stream) {
              const text = data.choices[0].text;
              for (const c of text) {
                result.push(c);
                if (
                  !result
                    .join("")
                    .match(RegExp(expr.options.pattern.source + "$", "g"))
                ) {
                  result = result.slice(0, -1);
                  break stream;
                }
              }
            }
            const val = result.join("");
            prompt.push(val);
            return val;
          } else if (isRepeatSlot(expr)) {
            let slots = [];
            for (let i = 0; i < expr.options.length; i++) {
              const result = await self.evalTemplate(
                prompt,
                expr.options.template,
                expr.options.expr
              );
              prompt = result.prompt;
              if (expr.options.expr.length === 1) {
                // when there is only one expression, we flatten it
                slots.push(...result.slots);
              } else {
                slots.push(result.slots);
              }
            }
            return slots;
          }
        }
      }
    }
    return {
      slots,
      prompt,
    };
  }
}

type LogitBias = {
  [token: number]: number;
};

function computeBias(slot: Expr): LogitBias | undefined {
  if (isSelectSlot(slot)) {
    return Object.fromEntries(
      slot.options.items.flatMap((item) =>
        gpt3.encode(item).map((e) => [e, 100])
      )
    );
  } else if (isRangeSlot(slot)) {
    const length = slot.options.to - slot.options.from;
    if (length > 1_000) {
      console.warn(`Range is too large: ${length}`);
      return undefined;
    }
    const bias: LogitBias = {};
    for (let i = slot.options.from; i <= slot.options.to; i++) {
      bias[gpt3.encode(i.toString())[0]] = 1;
    }
    return bias;
  }
  return undefined;
}
