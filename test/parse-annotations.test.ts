import ts from "typescript";
import { ParsedComment, parseComment } from "../src/parse-comment.js"; // The function to test

describe("parseAnnotations", () => {
  test("should parse single annotation without value", () => {
    const sourceFile = ts.createSourceFile(
      "test.ts",
      `
            /**
             * @param
             */
            function fn(param: any) {}
        `,
      ts.ScriptTarget.ES2015,
      true
    );
    const functionDeclaration = sourceFile.statements.find(
      ts.isFunctionDeclaration
    )!;
    expect(parseComment(ts, functionDeclaration)).toEqual({
      content: "",
    } satisfies ParsedComment);
  });

  test("should parse single annotation with value", () => {
    const sourceFile = ts.createSourceFile(
      "test.ts",
      `
            /**
             * @min 10
             */
            function fn() {}
        `,
      ts.ScriptTarget.ES2015,
      true
    );
    const functionDeclaration = sourceFile.statements.find(
      ts.isFunctionDeclaration
    )!;
    expect(parseComment(ts, functionDeclaration)).toEqual({
      content: "",
      min: 10,
    } satisfies ParsedComment);
  });

  test("should parse multiple annotations with multiline values", () => {
    const sourceFile = ts.createSourceFile(
      "test.ts",
      `
            /**
             * Hello
             * @param foo blah
             * blah blah
             * @max 50
             */
            function fn(foo: any, param: any) {}
        `,
      ts.ScriptTarget.ES2015,
      true
    );
    const functionDeclaration = sourceFile.statements.find(
      ts.isFunctionDeclaration
    )!;
    expect(parseComment(ts, functionDeclaration)).toEqual({
      content: "Hello",
      params: {
        foo: "blah\nblah blah",
      },
      max: 50,
    } satisfies ParsedComment);
  });
});
