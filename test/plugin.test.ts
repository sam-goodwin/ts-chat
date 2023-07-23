import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { loadTypeScriptProgram } from "../src/load-program.js";
import plugin from "../src/plugin.js";
import prettier from "prettier";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

test("compile stub project", async () => {
  const stubDir = path.join(__dirname, "stub");
  const program = loadTypeScriptProgram(stubDir, "tsconfig.json");

  program.emit(
    undefined,
    async (fileName, text) => {
      if (fileName.endsWith(".js")) {
        try {
          text = await prettier.format(text, {
            parser: "typescript",
          });
        } catch (err) {
          debugger;
        }
      }
      await fs.writeFile(fileName, text);
    },
    undefined,
    false,
    {
      before: [
        plugin(
          program,
          {},
          {
            ts,
            diagnostics: [],
            library: "",
            addDiagnostic: () => 0,
            removeDiagnostic: () => 0,
          }
        ),
      ],
    }
  );

  const stubLib = path.join(__dirname, "stub", "lib");
  const stubFiles = await fs.readdir(stubLib);
  const fileTuples = await Promise.all(
    stubFiles.map(async (file) => {
      if (file.endsWith(".js")) {
        return [[file, await fs.readFile(path.join(stubLib, file), "utf-8")]];
      } else {
        return [];
      }
    })
  );
  const files = Object.fromEntries(fileTuples.flat());
  expect(files).toMatchSnapshot();
});
