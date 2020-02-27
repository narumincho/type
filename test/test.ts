import * as t from "../source/main";
import { type } from "../source/main";
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
          name: "Bool",
          description: "真偽値",
          parameter: type.tagParameterNothing
        },
        {
          name: "DateTime",
          description: "日時",
          parameter: type.tagParameterNothing
        },
        {
          name: "List",
          description: "リスト",
          parameter: type.tagParameterJust(type.typeCustom("Type"))
        },
        {
          name: "Id",
          description:
            "Id. データを識別するためのもの. カスタムの型名を指定する",
          parameter: type.tagParameterJust(type.typeString())
        },
        {
          name: "Hash",
          description: "Hash. データを識別するためのHash",
          parameter: type.tagParameterJust(type.typeString())
        },
        {
          name: "AccessToken",
          description:
            "トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する",
          parameter: type.tagParameterNothing
        },
        {
          name: "Custom",
          description: "用意されていないアプリ特有の型",
          parameter: type.tagParameterJust(type.typeString())
        }
      ])
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
      ])
    }
  ];

  const exprType: [string, type.CustomType] = [
    "Expr",
    {
      body: type.customTypeBodySum([
        {
          name: "NumberLiteral",
          description: "数値リテラル `123`",
          parameter: type.tagParameterJust(type.typeUInt32())
        },
        {
          name: "StringLiteral",
          description: '文字列リテラル `"text"` エスケープする必要はない',
          parameter: type.tagParameterJust(type.typeString())
        },
        {
          name: "BooleanLiteral",
          description: "真偽値リテラル",
          parameter: type.tagParameterJust(type.typeBool())
        },
        {
          name: "NullLiteral",
          description: "nullリテラル",
          parameter: type.tagParameterNothing
        },
        {
          name: "UnaryOperator",
          description: "",
          parameter: type.tagParameterJust(type.typeCustom("UnaryOperator"))
        }
      ]),
      description: "式"
    }
  ];

  const unaryOperatorType: [string, type.CustomType] = [
    "UnaryOperator",
    {
      body: type.customTypeBodySum([
        {
          name: "Minus",
          parameter: type.tagParameterNothing,
          description: "単項マイナス"
        },
        {
          name: "LogicalNot",
          parameter: type.tagParameterNothing,
          description: "論理否定"
        },
        {
          name: "BitwiseNot",
          parameter: type.tagParameterNothing,
          description: "ビット否定"
        }
      ]),
      description: "1つの式に対する演算子"
    }
  ];
  const data: ReadonlyMap<string, type.CustomType> = new Map([
    exprType,
    unaryOperatorType
  ]);
  const typeDefinitionTypeScriptCode = generator.toNodeJsOrBrowserCodeAsTypeScript(
    t.generateTypeScriptCode(data, false)
  );
  const elmCodeAsString: string = t.elm.generateCode("Data", data);
  fs.writeFile("out.ts", typeDefinitionTypeScriptCode, () => {
    console.log("out put code at ./out.ts");
  });
  it("type definition typeScript", () => {
    console.log(typeDefinitionTypeScriptCode);
    expect(typeof typeDefinitionTypeScriptCode === "string").toBe(true);
  });
  it("type definition elm", () => {
    console.log(elmCodeAsString);
    expect(typeof elmCodeAsString === "string").toBe(true);
  });
});
