import type ts from "typescript";

export interface ParsedComment {
  content: string;
  params?: Record<string, string>;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  multipleOf?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  [key: string]: any;
}

export function parseComment(
  ts: typeof import("typescript"),
  node: ts.Node
): ParsedComment | undefined {
  const sourceFile = node.getSourceFile();
  const leadingTrivia = ts.getLeadingCommentRanges(
    sourceFile.getFullText(),
    node.getFullStart()
  );

  if (!leadingTrivia) {
    return undefined;
  }

  const parsedComment: ParsedComment = {
    content: "",
  };

  // TODO: support multiple comments??
  const trivia = leadingTrivia[0];

  const comment = sourceFile.getFullText().substring(trivia.pos, trivia.end);

  let currentContent: string = "";
  let currentAnnotation: string = "";
  let currentValue: string = "";

  const lines = comment.split("\n");

  let contentEnd = false;
  for (const line of lines) {
    const match = line.match(/^\s*\* @(\w+)\s?(.*)$/);

    if (match) {
      if (!contentEnd) {
        contentEnd = true;
        parsedComment.content = currentContent.trim();
      }
      // Found a new annotation
      finalize();
      currentAnnotation = match[1];
      currentValue = match[2];
    } else if (line.includes("/**")) {
      // Ignore
    } else if (!contentEnd) {
      currentContent += "\n" + line.replace(/^\s*\*/, "").trim();
    } else if (!line.includes("*/")) {
      currentValue += "\n" + line.replace(/^\s*\*/, "").trim();
    }
  }

  // Don't forget the last annotation
  finalize();

  return parsedComment;

  function finalize() {
    if (currentAnnotation) {
      const words = currentValue.split(" ");
      if (currentAnnotation === "param") {
        const paramName = words[0];
        if (paramName) {
          (parsedComment.params ??= {})[paramName] = words.slice(1).join(" ");
        }
      } else if (currentAnnotation === "min") {
        parsedComment.min = parseInt(words[0]);
      } else if (currentAnnotation === "max") {
        parsedComment.max = parseInt(words[0]);
      } else if (currentAnnotation === "minLength") {
        parsedComment.minLength = parseInt(words[0]);
      } else if (currentAnnotation === "maxLength") {
        parsedComment.maxLength = parseInt(words[0]);
      } else if (currentAnnotation === "pattern") {
        parsedComment.pattern = words[0];
      } else if (currentAnnotation === "format") {
        parsedComment.format = words[0];
      } else if (currentAnnotation === "multipleOf") {
        parsedComment.multipleOf = parseInt(words[0]);
      } else if (currentAnnotation === "exclusiveMinimum") {
        parsedComment.exclusiveMinimum = parseInt(words[0]);
      } else if (currentAnnotation === "exclusiveMaximum") {
        parsedComment.exclusiveMaximum = parseInt(words[0]);
      } else {
        parsedComment[currentAnnotation] = currentValue;
      }
    }
  }
}
