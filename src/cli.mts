#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { setup } from "./setup.js";

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName("ts-chat")
    .command(
      "setup",
      "install and configure ts-patch and ts-node",
      (yargs) => yargs,
      async (argv) => setup(process.cwd(), argv)
    ).argv;
}
