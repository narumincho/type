/// @ts-check

const childProcess = require("child_process");

childProcess.exec(
  "npx tsc --project test/tsconfig.json",
  (error, standardOutput, standardError) => {
    if (error === undefined) {
      console.log(standardError);
      throw error;
    }
    childProcess.exec(
      "node test/test.js",
      (error, standardOutput, standardError) => {
        if (error === undefined) {
          console.log(standardError);
          throw error;
        }
        console.log(standardOutput);
        console.log("終わり");
      }
    );
  }
);
