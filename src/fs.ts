import fs from "fs/promises";
import { constants } from "fs";

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

export async function exists(file: string) {
  try {
    await fs.access(file, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
