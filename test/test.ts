import * as t from "../source/index";
import { type } from "../source/index";
import * as generator from "js-ts-code-generator";
import * as fs from "fs";

describe("test", () => {
  const typeCustomType: [string, type.CustomType] = [
    "Type",
    {
      description: "型",
      body: type.customTypeBodySum([
        {
          name: "UInt32",
          description: "0～4294967295 32bit符号なし整数",
          parameter: type.tagParameterNothing
        },
        {
          name: "String",
          description: "文字列",
          parameter: type.tagParameterNothing
        },
        {
          name: "Id",
          description: "Id",
          parameter: type.tagParameterJust(type.typeString)
        },
        {
          name: "Hash",
          description: "データを識別するもので, データに応じて1つに決まる。",
          parameter: type.tagParameterJust(type.typeString)
        },
        {
          name: "List",
          description: "リスト. 複数の要素を表現する",
          parameter: type.tagParameterJust(type.typeCustom("Type"))
        },
        {
          name: "Custom",
          description: "用意されていない型.",
          parameter: type.tagParameterJust(type.typeString)
        }
      ]),
      idHashType: type.IdHashType.Id
    }
  ];

  const dictionaryType: [string, type.CustomType] = [
    "DictionaryType",
    {
      description: "キーと値",
      body: type.customTypeBodyProduct([
        {
          name: "key",
          description: "キー. Dictionary内で重複しない",
          memberType: type.typeCustom("Type")
        },
        {
          name: "value",
          description: "値",
          memberType: type.typeCustom("Type")
        }
      ]),
      idHashType: type.IdHashType.None
    }
  ];

  const data: ReadonlyMap<string, type.CustomType> = new Map([
    typeCustomType,
    dictionaryType
  ]);
  const typeDefinitionTypeScriptCode = generator.toNodeJsOrBrowserCodeAsTypeScript(
    t.generateTypeScriptCode(data, false)
  );
  const elmCodeAsString: string = t.elm.generateCode("Data", data);
  // fs.writeFile("out.ts", typeDefinitionTypeScriptCode, () => {
  //   console.log("out put code at ./out.ts");
  // });
  it("type definition typeScript", () => {
    console.log(typeDefinitionTypeScriptCode);
    expect(typeof typeDefinitionTypeScriptCode === "string").toBe(true);
  });
  it("type definition elm", () => {
    console.log(elmCodeAsString);
    expect(typeof elmCodeAsString === "string").toBe(true);
  });
});
