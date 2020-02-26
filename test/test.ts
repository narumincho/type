import * as t from "../source/index";
import { type } from "../source/index";
import * as generator from "js-ts-code-generator";

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
          name: "Dictionary",
          description: "辞書. キーと値の組のリストだがキーは重複しない",
          parameter: type.tagParameterJust(type.typeCustom("DictionaryType"))
        },
        {
          name: "Set",
          description: "集合. 要素は重複しない",
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
  const typeScriptCode: generator.Code = t.typeScript.generateCode(data);
  const typeScriptCodeAsString = generator.toNodeJsOrBrowserCodeAsTypeScript(
    typeScriptCode
  );
  const elmCodeAsString: string = t.elm.generateCode("Data", data);
  it("return string", () => {
    console.log(typeScriptCodeAsString);
    expect(typeof typeScriptCodeAsString === "string").toBe(true);
  });
  it("elm return string", () => {
    console.log(elmCodeAsString);
    expect(typeof elmCodeAsString === "string").toBe(true);
  });
});
