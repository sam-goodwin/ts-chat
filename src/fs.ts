import fs from "fs/promises";

export async function tryReadJsonFile(file: string) {
  const string = await tryReadFile(file);
  if (string) {
    return JSON.parse(string);
  }
  return undefined;
}

export async function tryReadFile(file: string) {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return undefined;
  }
}
