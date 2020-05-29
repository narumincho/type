import * as nType from "../source/main";
import { type as data } from "../source/main";
import { Type, Maybe, CustomTypeDefinitionBody } from "../source/type";
import * as jsTsCodeGenerator from "js-ts-code-generator";
import { promises as fileSystem } from "fs";
import * as prettier from "prettier";

const typeName = "Type";
const okAndErrorTypeName = "OkAndErrorType";
const nameAndTypeParameterListName = "NameAndTypeParameterList";
const customTypeDefinitionName = "CustomTypeDefinition";
const customTypeDefinitionBodyName = "CustomTypeDefinitionBody";
const memberName = "Member";
const patternName = "Pattern";

const typeType = Type.Custom({ name: typeName, parameterList: [] });
const okAndErrorTypeType = Type.Custom({
  name: okAndErrorTypeName,
  parameterList: [],
});
const nameAndTypeParameterListType = Type.Custom({
  name: nameAndTypeParameterListName,
  parameterList: [],
});
const customTypeDefinitionType = Type.Custom({
  name: customTypeDefinitionName,
  parameterList: [],
});
const customTypeDefinitionBodyType = Type.Custom({
  name: customTypeDefinitionBodyName,
  parameterList: [],
});
const memberType = Type.Custom({
  name: memberName,
  parameterList: [],
});
const patternType = Type.Custom({
  name: patternName,
  parameterList: [],
});

const customTypeDefinitionList: ReadonlyArray<nType.type.CustomTypeDefinition> = [
  {
    name: typeName,
    description: "型",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
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
    body: CustomTypeDefinitionBody.Product([
      {
        name: "ok",
        description: "正常値",
        type: typeType,
      },
      {
        name: "error",
        description: "異常値",
        type: typeType,
      },
    ]),
  },
  {
    name: nameAndTypeParameterListName,
    description: "カスタム型の指定",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "カスタム型名",
        type: Type.String,
      },
      {
        name: "parameterList",
        description: "型パラメーター",
        type: Type.List(typeType),
      },
    ]),
  },
  {
    name: customTypeDefinitionName,
    description: "カスタム型の定義",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "型の名前. [A-Z][a-zA-Z0-9]* の正規表現を満たせばOK",
        type: Type.String,
      },
      {
        name: "description",
        description: "型の説明. DOCコメントそしてコードに出力される",
        type: Type.String,
      },
      {
        name: "typeParameterList",
        description:
          "型パラメーターは小文字で始めなければならない. Elmでの出力と外部の型を隠さないようにするため",
        type: Type.List(Type.String),
      },
      {
        name: "body",
        description: "型の定義の本体",
        type: customTypeDefinitionBodyType,
      },
    ]),
  },
  {
    name: customTypeDefinitionBodyName,
    description: "カスタム型の定義の本体",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Product",
        description: "直積型. AとBとC",
        parameter: Maybe.Just(Type.List(memberType)),
      },
      {
        name: "Sum",
        description: "直和型. AかBかC",
        parameter: Maybe.Just(Type.List(patternType)),
      },
    ]),
  },
  {
    name: memberName,
    description: "直積型の構成要素. 名前と型を持つ",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "メンバー名",
        type: Type.String,
      },
      {
        name: "description",
        description: "メンバーの説明",
        type: Type.String,
      },
      {
        name: "type",
        description: "型",
        type: typeType,
      },
    ]),
  },
  {
    name: patternName,
    description: "直和型の構成要素. タグと,パラメーターの型がついている",
    typeParameterList: [],
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "タグ名",
        type: Type.String,
      },
      {
        name: "description",
        description: "パターンの説明",
        type: Type.String,
      },
      {
        name: "parameter",
        description: "そのパターンにある型",
        type: Type.Maybe(typeType),
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
