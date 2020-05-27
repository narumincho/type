import * as t from "../source/main";
import { type } from "../source/main";
import * as generator from "js-ts-code-generator";
import * as fileSystem from "fs";
import * as ts from "typescript";
import * as prettier from "prettier";

const fileHash = type.typeToken("FileHash");

const typeName = "Type";
const typeType = type.typeCustom({ name: typeName, parameterList: [] });
const resultTypeName = "ResultType";
const resultTypeType = type.typeCustom({
  name: resultTypeName,
  parameterList: [],
});
const accessToken = type.typeToken("AccessToken");
const urlDataName = "UrlData";
const clientModeName = "ClientMode";
const clientModeType = type.typeCustom({
  name: clientModeName,
  parameterList: [],
});
const locationName = "Location";
const locationType = type.typeCustom({ name: locationName, parameterList: [] });
const languageName = "Language";
const languageType = type.typeCustom({ name: languageName, parameterList: [] });
const projectName = "Project";

const responseWithIdName = "ResponseWithId";
const responseName = "Response";
const responseType = (type_: type.Type): type.Type =>
  type.typeCustom({ name: responseName, parameterList: [type_] });

const customTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
  {
    name: typeName,
    typeParameterList: [],
    description: "型",
    body: type.customTypeBodySum([
      {
        name: "Int",
        description:
          "-9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲",
        parameter: type.maybeNothing(),
      },
      {
        name: "String",
        description: "文字列",
        parameter: type.maybeNothing(),
      },
      {
        name: "Bool",
        description: "真偽値",
        parameter: type.maybeNothing(),
      },
      {
        name: "List",
        description: "リスト",
        parameter: type.maybeJust(typeType),
      },
      {
        name: "Maybe",
        description: "Maybe",
        parameter: type.maybeJust(typeType),
      },
      {
        name: "Result",
        description: "Result",
        parameter: type.maybeJust(resultTypeType),
      },
      {
        name: "Id",
        description:
          "データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字",
        parameter: type.maybeJust(type.typeString),
      },
      {
        name: "Token",
        description:
          "データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字",
        parameter: type.maybeJust(type.typeString),
      },
      {
        name: "Custom",
        description: "用意されていないアプリ特有の型",
        parameter: type.maybeJust(type.typeString),
      },
      {
        name: "Parameter",
        description: "型パラメーター",
        parameter: type.maybeJust(type.typeString),
      },
    ]),
  },
  {
    name: resultTypeName,
    typeParameterList: [],
    description: "正常値と異常値",
    body: type.customTypeBodyProduct([
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
    name: urlDataName,
    typeParameterList: [],
    description:
      "デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる",
    body: type.customTypeBodyProduct([
      {
        name: "clientMode",
        description: "クライアントモード",
        memberType: clientModeType,
      },
      {
        name: "location",
        description: "場所",
        memberType: locationType,
      },
      {
        name: "language",
        description: "言語",
        memberType: languageType,
      },
      {
        name: "accessToken",
        description:
          "アクセストークン. ログインした後のリダイレクト先としてサーバーから渡される",
        memberType: type.typeMaybe(accessToken),
      },
      {
        name: "if",
        description: "予約語をこっそり入れてみる",
        memberType: type.typeBool,
      },
    ]),
  },
  {
    name: clientModeName,
    typeParameterList: [],
    description: "デバッグの状態と, デバッグ時ならアクセスしているポート番号",
    body: type.customTypeBodySum([
      {
        name: "DebugMode",
        description:
          "デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの",
        parameter: type.maybeJust(type.typeInt32),
      },
      {
        name: "Release",
        description: "リリースモード. https://definy.app ",
        parameter: type.maybeNothing(),
      },
    ]),
  },
  {
    name: locationName,
    typeParameterList: [],
    description:
      "DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる",
    body: type.customTypeBodySum([
      {
        name: "Home",
        description: "最初のページ",
        parameter: type.maybeNothing(),
      },
      {
        name: "User",
        description: "ユーザーの詳細ページ",
        parameter: type.maybeJust(type.typeId("UserId")),
      },
      {
        name: "Project",
        description: "プロジェクトの詳細ページ",
        parameter: type.maybeJust(type.typeId("ProjectId")),
      },
    ]),
  },
  {
    name: languageName,
    typeParameterList: [],
    description: "英語,日本語,エスペラント語などの言語",
    body: type.customTypeBodySum([
      {
        name: "Japanese",
        description: "日本語",
        parameter: type.maybeNothing(),
      },
      {
        name: "English",
        description: "英語",
        parameter: type.maybeNothing(),
      },
      {
        name: "Esperanto",
        description: "エスペラント語",
        parameter: type.maybeNothing(),
      },
    ]),
  },
  {
    name: projectName,
    typeParameterList: [],
    description: "プロジェクト",
    body: type.customTypeBodyProduct([
      {
        name: "name",
        description: "プロジェクト名",
        memberType: type.typeString,
      },
      {
        name: "icon",
        description: "プロジェクトのアイコン画像",
        memberType: fileHash,
      },
      {
        name: "image",
        description: "プロジェクトのカバー画像",
        memberType: fileHash,
      },
    ]),
  },
  {
    name: responseWithIdName,
    typeParameterList: ["id", "data"],
    description:
      "Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス",
    body: type.customTypeBodyProduct([
      {
        name: "id",
        description: "リクエストしたリソースのID",
        memberType: type.typeParameter("id"),
      },
      {
        name: "response",
        description: "レスポンス",
        memberType: responseType(type.typeParameter("data")),
      },
    ]),
  },
  {
    name: responseName,
    typeParameterList: ["data"],
    description: "リソースをリクエストしたあとのレスポンス",
    body: type.customTypeBodySum([
      {
        name: "ConnectionError",
        description: "オフラインかサーバー上でエラーが発生しました",
        parameter: type.maybeNothing(),
      },
      {
        name: "NotFound",
        description: "リソースが存在しない",
        parameter: type.maybeNothing(),
      },
      {
        name: "Found",
        description: "取得に成功した",
        parameter: type.maybeJust(type.typeParameter("data")),
      },
    ]),
  },
];

const typeDefinitionTypeScriptCode = generator.generateCodeAsString(
  t.generateTypeScriptCode(customTypeList),
  "TypeScript"
);

const testOutFolderName = "testOut";
const typeScriptPath = testOutFolderName + "/out.ts";

fileSystem.mkdir(testOutFolderName, () => {
  fileSystem.promises
    .writeFile(
      typeScriptPath,
      prettier.format(typeDefinitionTypeScriptCode, { parser: "typescript" })
    )
    .then(() => {
      console.log("TypeScript output code");
      ts.createProgram({
        rootNames: [testOutFolderName + "/main.ts"],
        options: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          lib: ["ES2020"],
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          newLine: ts.NewLineKind.LineFeed,
          outDir: "testOutJs",
          strict: true,
        },
      }).emit();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../testOutJs/main.js");
    });
});
