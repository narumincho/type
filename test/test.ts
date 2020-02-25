import * as t from "../source/index";
import * as generator from "js-ts-code-generator";

describe("test", () => {
  const data: ReadonlyMap<string, t.type.CustomType> = new Map([
    [
      "",
      {
        description: "サンプル",
        body: t.type.customTypeBodyProduct([
          {
            name: "UInt32",
            description: "0～4294967295 32bit符号なし整数",
            parameter: t.type.tagParameterNothing
          },
          {
            name: "String",
            description: "文字列",
            parameter: t.type.tagParameterNothing
          }
        ])
      }
    ]
  ]);
  const code: generator.Code = t.typeScript.generateCode(data);
  const codeAsString = generator.toNodeJsOrBrowserCodeAsTypeScript(code);
  it("return string", () => {
    console.log(codeAsString);
    expect(typeof codeAsString === "string").toBe(true);
  });
});
