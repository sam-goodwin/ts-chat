import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { loadTypeScriptProgram } from "../src/load-program.js";
import plugin from "../src/plugin.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

test("compile stub project", async () => {
  const stubDir = path.join(__dirname, "stub");
  const program = loadTypeScriptProgram(stubDir, "tsconfig.json");

  const createTransformer = plugin(
    program,
    {},
    {
      ts,
      diagnostics: [],
      library: "",
      addDiagnostic: () => 0,
      removeDiagnostic: () => 0,
    }
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  program.emit(undefined, async (fileName, text) => {
    const sf = program.getSourceFile(fileName);

    const dir = path.dirname(fileName);
    if (dir.includes(__dirname)) {
      await fs.mkdir(dir, { recursive: true });

      if (sf) {
        const transformedSf = ts.transform(sf, [
          (ctx) => createTransformer(ctx),
        ]);
        const result = printer.printFile(transformedSf.transformed[0]);
        await fs.writeFile(fileName, result);
      } else {
        await fs.writeFile(fileName, text);
      }
    }
  });

  const stubLib = path.join(__dirname, "stub", "lib");
  const stubFiles = await fs.readdir(stubLib);
  await Promise.all(
    stubFiles.map(async (file) => {
      if (file.endsWith(".js")) {
        const content = await fs.readFile(path.join(stubLib, file), "utf-8");
        expect(content).toMatchSnapshot(file);
      }
    })
  );
});
