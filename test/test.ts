import * as t from "../source/main";
import { type } from "../source/main";
import * as generator from "js-ts-code-generator";
import * as fs from "fs";

describe("test", () => {
  const typeType: type.CustomType = {
    name: "Type",
    description: "型",
    body: type.customTypeBodySum([
      {
        name: "UInt32",
        description: "0～4294967295 32bit符号なし整数",
        parameter: type.maybeNothing()
      },
      {
        name: "String",
        description: "文字列",
        parameter: type.maybeNothing()
      },
      {
        name: "Bool",
        description: "真偽値",
        parameter: type.maybeNothing()
      },
      {
        name: "DateTime",
        description: "日時",
        parameter: type.maybeNothing()
      },
      {
        name: "List",
        description: "リスト",
        parameter: type.maybeJust(type.typeCustom("Type"))
      },
      {
        name: "Maybe",
        description: "Maybe",
        parameter: type.maybeJust(type.typeCustom("Type"))
      },
      {
        name: "Result",
        description: "Result",
        parameter: type.maybeJust(type.typeCustom("ResultType"))
      },
      {
        name: "Id",
        description:
          "データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字",
        parameter: type.maybeJust(type.typeString)
      },
      {
        name: "Token",
        description:
          "データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字",
        parameter: type.maybeJust(type.typeString)
      },
      {
        name: "Custom",
        description: "用意されていないアプリ特有の型",
        parameter: type.maybeJust(type.typeString)
      }
    ])
  };

  const resultTypeType: type.CustomType = {
    name: "ResultType",
    description: "正常値と異常値",
    body: type.customTypeBodyProduct([
      {
        name: "ok",
        description: "正常値",
        memberType: type.typeCustom("Type")
      },
      {
        name: "error",
        description: "異常値",
        memberType: type.typeCustom("Type")
      }
    ])
  };

  const schema: type.Schema = {
    customTypeList: [typeType, resultTypeType],
    idOrHashTypeNameList: ["UserId", "FileToken"]
  };

  const typeDefinitionTypeScriptCode = generator.generateCodeAsString(
    t.generateTypeScriptCode(schema, false),
    "TypeScript"
  );
  const elmCodeAsString: string = t.elm.generateCode("Data", schema);
  fs.promises.writeFile("out.ts", typeDefinitionTypeScriptCode);
  fs.promises.writeFile("out.elm", elmCodeAsString);
  it("type definition typeScript", () => {
    console.log(typeDefinitionTypeScriptCode);
    expect(typeof typeDefinitionTypeScriptCode === "string").toBe(true);
  });
  it("type definition elm", () => {
    console.log(elmCodeAsString);
    expect(typeof elmCodeAsString === "string").toBe(true);
  });
});
