import * as nType from "../source/main";
import { type as data } from "../source/main";
import { Type, Maybe } from "../source/type";
import * as jsTsCodeGenerator from "js-ts-code-generator";
import { promises as fileSystem } from "fs";
import * as prettier from "prettier";

const typeName = "Type";
const okAndErrorTypeName = "OkAndErrorType";
const nameAndTypeParameterListName = "NameAndTypeParameterList";

const typeType = Type.Custom({ name: typeName, parameterList: [] });
const okAndErrorTypeType = Type.Custom({
  name: okAndErrorTypeName,
  parameterList: [],
});
const nameAndTypeParameterListType = Type.Custom({
  name: nameAndTypeParameterListName,
  parameterList: [],
});

const customTypeDefinitionList: ReadonlyArray<nType.type.CustomTypeDefinition> = [
  {
    name: typeName,
    description: "型",
    typeParameterList: [],
    body: data.customTypeBodySum([
      {
        name: "Int32",
        description:
          "32bit 符号付き整数. (-2 147 483 648 ～ 2147483647). JavaScriptのnumberとして扱える",
        parameter: Maybe.Nothing(),
      },
      {
        name: "String",
        description: "文字列. JavaScriptのStringとして扱える",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Bool",
        description: "真偽値. JavaScriptのbooleanとして扱える",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Binary",
        description: "バイナリ. JavaScriptのUint8Arrayとして扱える",
        parameter: Maybe.Nothing(),
      },
      {
        name: "List",
        description: "リスト. JavaScriptのArrayとして扱える",
        parameter: Maybe.Just(typeType),
      },
      {
        name: "Maybe",
        description:
          "Maybe. 指定した型の値があるJustと値がないNothingのどちらか",
        parameter: Maybe.Just(typeType),
      },
      {
        name: "Result",
        description: "Result. 成功と失敗を表す",
        parameter: Maybe.Just(okAndErrorTypeType),
      },
      {
        name: "Id",
        description:
          "データを識別するためのもの. `UserId`などの型名を指定する. 16byte. 16進数文字列で32文字",
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "Token",
        description:
          "データを識別,証明するため. `AccessToken`などの型名を指定する. 32byte. 16進数文字列で64文字",
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "Custom",
        description: "用意されていないアプリ特有の型",
        parameter: Maybe.Just(nameAndTypeParameterListType),
      },
      {
        name: "Parameter",
        description: "カスタム型の定義で使う型変数",
        parameter: Maybe.Just(Type.String),
      },
    ]),
  },
  {
    name: okAndErrorTypeName,
    description: "正常値と異常値",
    typeParameterList: [],
    body: data.customTypeBodyProduct([
      {
        name: "ok",
        description: "正常値",
        memberType: typeType,
      },
      {
        name: "error",
        description: "異常値",
        memberType: typeType,
      },
    ]),
  },
  {
    name: nameAndTypeParameterListName,
    description: "カスタム型の指定",
    typeParameterList: [],
    body: data.customTypeBodyProduct([
      {
        name: "name",
        description: "カスタム型名",
        memberType: Type.String,
      },
      {
        name: "parameterList",
        description: "型パラメーター",
        memberType: Type.List(typeType),
      },
    ]),
  },
];

const code = prettier.format(
  jsTsCodeGenerator.generateCodeAsString(
    nType.generateTypeScriptCode(customTypeDefinitionList),
    "TypeScript"
  ),
  {
    parser: "typescript",
  }
);
console.log(code);

fileSystem.writeFile("./source/data.ts", code).then(() => {
  console.log("output data.ts");
});
