export function trimTemplate(template: TemplateStringsArray): string[] {
  if (template[0].startsWith("\n")) {
    const lines = template[0].split("\n");
    const indent = lines[1]?.match(/^\s+/)?.[0].length;
    if (indent) {
      return template.raw.map((str, i) => {
        let lines = str.split("\n");
        if (i === 0) {
          // skip the first line - this heuristic requires the first line be an immediate new line
          lines = lines.slice(1);
        }
        return lines
          .map((line, j) => {
            if (i > 0 && j === 0 && line.trim() !== "") {
              // ${val}  text
              // this catches the case where text proceeds a variable - we should not trim it
              return line;
            }
            const leadingSpaces = line.match(/^\s+/)?.[0];
            if (leadingSpaces) {
              if (leadingSpaces.length <= indent) {
                return line.trimStart();
              }
              return line.slice(indent);
            }
            if (line.startsWith(" ".repeat(indent))) {
              return line.slice(indent);
            }
            return line;
          })
          .join("\n");
      });
    }
  }
  return [...template.raw];
}
