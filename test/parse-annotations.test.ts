import ts from "typescript";
import { Comment, parseComment } from "../src/comment.js"; // The function to test

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
    expect(parseComment(ts, functionDeclaration)).toEqual(undefined);
  });

  test("should parse single annotation with value", () => {
    const sourceFile = ts.createSourceFile(
      "test.ts",
      `
            /**
             * @minimum 10
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
      minimum: 10,
    } satisfies Comment);
  });

  test("should parse multiple annotations with multiline values", () => {
    const sourceFile = ts.createSourceFile(
      "test.ts",
      `
            /**
             * Hello
             * @param foo blah
             * blah blah
             * @maximum 50
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
      maximum: 50,
    } satisfies Comment);
  });
});
