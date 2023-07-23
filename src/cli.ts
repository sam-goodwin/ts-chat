#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { setup } from "./setup.js";

await yargs(hideBin(process.argv))
  .scriptName("ts-chat")
  .command(
    "setup",
    "install and configure ts-patch and ts-node",
    (yargs) => yargs,
    async (argv) => setup(process.cwd(), argv)
  ).argv;
