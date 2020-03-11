/// @ts-check

const ts = require("typescript");
const childProcess = require("child_process");
const fs = require("fs");

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

childProcess.exec(
  "node testJs/test/main.js",
  (error, standardOutput, standardError) => {
    if (error !== undefined) {
      throw error;
    }
    if (standardError !== "") {
      console.error("standardError", standardError);
    }
    console.log(standardOutput);
  }
);
