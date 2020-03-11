/// @ts-check

const ts = require("typescript");

ts.createProgram({
  rootNames: ["test/main.ts"],
  options: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    lib: ["ES2020"],
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    newLine: ts.NewLineKind.LineFeed,
    outDir: "testJs",
    strict: true
  }
}).emit();

require("../testJs/test/main.js");
