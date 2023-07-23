import path from "path";
import ts from "typescript";

export function loadTypeScriptProgram(
  projectDir: string,
  /**
   * Relative tsconfig
   */
  tsconfig: string,
  overrides?: {
    config?: Partial<ts.CompilerOptions>;
    files?: string[];
    oldProgram?: ts.Program;
  }
): ts.Program {
  const parsedCommandLine = loadTSConfigFile(projectDir, tsconfig);

  if (parsedCommandLine) {
    const program = ts.createProgram(
      // overrides?.files ?? parsedCommandLine.fileNames,
      parsedCommandLine.fileNames,
      {
        ...parsedCommandLine.options,
        ...overrides?.config,
      },
      undefined,
      overrides?.oldProgram
    );
    return program;
  } else {
    throw new Error(`failed to load program`);
  }
}

/**
 * Load the typescript config file for a project.
 */
function loadTSConfigFile(
  projectDir: string,
  /**
   * Relative path to tsconfig
   */
  tsconfig: string
): ts.ParsedCommandLine | undefined {
  const absoluteTsConfigPath = path.resolve(projectDir, tsconfig);
  const configFile = ts.readConfigFile(absoluteTsConfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n")
    );
  }

  const configParseResult = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(absoluteTsConfigPath)
  );
  if (configParseResult.errors.length > 0) {
    if (
      configParseResult.errors.length === 1 &&
      configParseResult.errors[0]!.code === 18003
    ) {
      // this is an empty project, no need to throw error
      return undefined;
    }
    throw new Error(
      ts.formatDiagnostics(configParseResult.errors, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      })
    );
  }

  return configParseResult;
}
