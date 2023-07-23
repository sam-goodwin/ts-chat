import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { tryReadJsonFile } from "./fs.js";

/**
 * An idempotent setup process that:
 * 1. Adds `ts-patch install` to the `prepare` script in `package.json`
 * 2. Adds the `typesafe-ai/transformer` to the `compilerOptions.plugins` in `tsconfig.json`
 * 3. Installs `ts-patch` and `ts-node` as dev dependencies using the project's
 * package manager discovered by looking for lock files (such as `package-lock.json`,
 * `yarn.lock`, and `pnpm-lock.yaml`)
 */
export async function setup(cwd: string, _argv: any) {
  const packageJsonPath = path.join(cwd, "package.json");
  const tsConfigPath = path.join(cwd, "tsconfig.json");
  const [packageJson, tsConfig] = await Promise.all([
    tryReadJsonFile(packageJsonPath),
    tryReadJsonFile(tsConfigPath),
  ]);
  if (!packageJson) {
    exit(1, "Could not find package.json");
  }
  if (!tsConfig) {
    exit(1, "Could not find tsconfig.json");
  }
  if (packageJson.scripts === undefined) {
    packageJson.scripts = {};
  }
  if (packageJson.scripts.prepare) {
    if (!packageJson.scripts.prepare.includes("ts-patch install")) {
      packageJson.scripts.prepare += " & ts-patch install";
    }
  } else {
    packageJson.scripts.prepare = "ts-patch install";
  }

  if (tsConfig.compilerOptions === undefined) {
    tsConfig.compilerOptions = {};
  }
  if (tsConfig.compilerOptions.plugins === undefined) {
    tsConfig.compilerOptions.plugins = [];
  } else if (!Array.isArray(tsConfig.compilerOptions.plugins)) {
    exit(1, "compilerOptions.plugins is not an array");
  }
  const transformerName = "typesafe-ai/plugin";
  if (
    (tsConfig.compilerOptions.plugins as any[]).find(
      (p) => p && typeof p === "object" && p.transformer === transformerName
    ) === undefined
  ) {
    tsConfig.compilerOptions.plugins.push({
      transformer: transformerName,
    });
  }

  await Promise.all([
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)),
    fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2)),
  ]);

  if (
    !(
      "ts-patch" in packageJson.devDependencies ||
      "ts-node" in packageJson.devDependencies
    )
  ) {
    const pkgManager = await discoverPackageManager(cwd);
    if (pkgManager === "npm") {
      await sh(`npm install --save-dev ts-patch ts-node`);
    } else if (pkgManager === "yarn") {
      await sh(`yarn add -D ts-patch ts-node`);
    } else {
      await sh(`pnpm add -D ts-patch ts-node`);
    }
  }
}

function exit(code: number, message: string): never {
  console.log(message);
  process.exit(code);
}

interface ExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function sh(cmd: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) =>
      resolve({
        exitCode: error?.code ?? 0,
        stdout,
        stderr,
      })
    );
  });
}

/**
 * Discovers the package manager used by the project at the given path
 * by looking for lock files, such as `package-lock.json`, `yarn.lock`,
 * and `pnpm-lock.yaml`. If none of these files are found, `npm` is
 * assumed.
 *
 * @param projectPath the path to the project
 * @returns the package manager used by the project
 */
export async function discoverPackageManager(
  projectPath: string
): Promise<"npm" | "pnpm" | "yarn"> {
  const pkgManager = await discover();
  if (process.env.DEBUG) {
    console.log(`Discovered package manager: ${pkgManager}`);
  }
  return pkgManager;

  async function discover() {
    try {
      const json = JSON.parse(
        await fs.readFile(path.join(projectPath, "package.json"), "utf-8")
      );
      if (typeof json === "object" && "packageManager" in json) {
        const pkgManager = json.packageManager;
        if (typeof pkgManager === "string") {
          if (pkgManager.startsWith("pnpm")) {
            return "pnpm";
          } else if (pkgManager.startsWith("yarn")) {
            return "yarn";
          } else if (pkgManager.startsWith("npm")) {
            return "npm";
          }
        }
      }
    } catch {}

    try {
      await fs.access(path.join(projectPath, "package-lock.json"));
      return "npm";
    } catch {}

    try {
      await fs.access(path.join(projectPath, "yarn.lock"));
      return "yarn";
    } catch {}

    try {
      await fs.access(path.join(projectPath, "pnpm-lock.yaml"));
      return "pnpm";
    } catch {}

    return "npm";
  }
}
