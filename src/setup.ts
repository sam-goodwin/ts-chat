import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { exists, tryReadJsonFile } from "./fs.js";

/**
 * An idempotent setup process that:
 * 1. Adds `ts-patch install` to the `prepare` script in `package.json`
 * 2. Adds the `ts-chat/transformer` to the `compilerOptions.plugins` in `tsconfig.json`
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
  const transformerName = "ts-chat/plugin";
  if (
    (tsConfig.compilerOptions.plugins as any[]).find(
      (p) => p && typeof p === "object" && p.transform === transformerName
    ) === undefined
  ) {
    tsConfig.compilerOptions.plugins.push({
      transform: transformerName,
    });
  }

  await Promise.all([
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)),
    fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2)),
  ]);

  if (packageJson.devDependencies === undefined) {
    packageJson.devDependencies = {};
  }

  const dependencies = [];
  if (!("ts-patch" in packageJson.devDependencies)) {
    dependencies.push("ts-patch");
  }
  if (!("ts-node" in packageJson.devDependencies)) {
    dependencies.push("ts-node");
  }
  if (dependencies.length > 0) {
    const pkgManager = await discoverPackageManager(cwd);
    if (pkgManager === "npm") {
      await sh("npm", "install", "--save-dev", "ts-patch", "ts-node");
    } else if (pkgManager === "yarn") {
      await sh("yarn", "add", "-D", "ts-patch", "ts-node");
    } else {
      await sh("pnpm", "add", "-D", "ts-patch", "ts-node");
    }
  }
}

function exit(code: number, message: string): never {
  console.log(message);
  process.exit(code);
}

function sh(command: string, ...args: string[]): Promise<number> {
  console.log(`${command} ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const subprocess = spawn(command, args, { stdio: "inherit" });

    subprocess.on("close", (exitCode) => {
      resolve(exitCode ?? 0);
    });

    subprocess.on("error", (error) => {
      reject(error);
    });
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
  return discover(projectPath);

  async function discover(currentDir: string) {
    if (currentDir === "/") {
      throw new Error(
        `Could not find package manager starting from ${projectPath}`
      );
    }

    const pkgJsonPath = path.join(currentDir, "package.json");
    if (!(await exists(pkgJsonPath))) {
      // if there is no package.json here, then crawl upwards through the file system
      return discover(path.resolve(currentDir, ".."));
    }

    try {
      const json = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));

      // check if the package.json explicitly configures a package manager
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
      await fs.access(path.join(currentDir, "package-lock.json"));
      return "npm";
    } catch {}

    try {
      await fs.access(path.join(currentDir, "yarn.lock"));
      return "yarn";
    } catch {}

    try {
      await fs.access(path.join(currentDir, "pnpm-lock.yaml"));
      return "pnpm";
    } catch {}

    return discover(path.resolve(currentDir, ".."));
  }
}
