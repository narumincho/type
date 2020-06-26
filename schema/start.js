/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/// @ts-check

const ts = require("typescript");

ts.createProgram({
  rootNames: ["schema/main.ts"],
  options: {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.CommonJS,
    lib: ["ES2019"],
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    newLine: ts.NewLineKind.LineFeed,
    outDir: "schemaJs",
    strict: true,
  },
}).emit();

require("../schemaJs/schema/main.js");
