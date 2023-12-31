import fs from "fs/promises";
import path from "path";
import { loadTypeScriptProgram } from "../src/load-program.js";
import prettier from "prettier";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

test("compile stub project", async () => {
  const stubDir = path.join(__dirname, "stub");
  const program = loadTypeScriptProgram(stubDir, "tsconfig.json");

  const promises: Promise<void>[] = [];
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
      promises.push(
        (async () => {
          await fs.mkdir(path.dirname(fileName), { recursive: true });
          await fs.writeFile(fileName, text);
        })()
      );
    },
    undefined,
    false
  );
  await Promise.all(promises);

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
