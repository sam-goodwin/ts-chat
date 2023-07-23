#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { setup } from "./setup.js";

yargs(hideBin(process.argv))
  .scriptName("typesafe-ai")
  .command(
    "setup",
    "install and configure ts-patch and ts-node",
    (yargs) => yargs,
    async (argv) => setup(process.cwd(), argv)
  );
