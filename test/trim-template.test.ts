import { trimTemplate } from "../src/util/trim-template.js";

function t(template: TemplateStringsArray, ...args: any[]) {
  return trimTemplate(template);
}

test("should trim indentations", () => {
  expect(t`
    hello
      world`).toEqual([`hello\n  world`]);

  expect(t`
    hello
    ${""}world`).toEqual(["hello\n", "world"]);

  expect(t`
    hello
    ${""}  world`).toEqual(["hello\n", "  world"]);

  expect(t`
    hello
    ${""}
      world`).toEqual(["hello\n", "\n  world"]);

  expect(t`
    hello
    world`).toEqual([`hello\nworld`]);

  expect(t`
    hello
  world`).toEqual([`hello\nworld`]);
});
