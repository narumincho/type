import * as nType from "../source/main";
import {
  Maybe,
  Type,
  CustomTypeDefinition,
  CustomTypeDefinitionBody,
} from "../source/data";
import * as generator from "js-ts-code-generator";
import * as fileSystem from "fs";
import * as ts from "typescript";
import * as prettier from "prettier";

const fileHash = Type.Token("FileHash");

const typeName = "Type";
const typeType = Type.Custom({ name: typeName, parameterList: [] });
const resultTypeName = "ResultType";
const resultTypeType = Type.Custom({
  name: resultTypeName,
  parameterList: [],
});
const accessToken = Type.Token("AccessToken");
const urlDataName = "UrlData";
const clientModeName = "ClientMode";
const clientModeType = Type.Custom({
  name: clientModeName,
  parameterList: [],
});
const locationName = "Location";
const locationType = Type.Custom({ name: locationName, parameterList: [] });
const languageName = "Language";
const languageType = Type.Custom({ name: languageName, parameterList: [] });
const projectName = "Project";

const responseWithIdName = "ResponseWithId";
const responseName = "Response";
const responseType = (type_: Type): Type =>
  Type.Custom({ name: responseName, parameterList: [type_] });

const customTypeList: ReadonlyArray<CustomTypeDefinition> = [
  {
    name: typeName,
    typeParameterList: [],
    description: "型",
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Int",
        description:
          "-9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲",
        parameter: Maybe.Nothing(),
      },
      {
        name: "String",
        description: "文字列",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Bool",
        description: "真偽値",
        parameter: Maybe.Nothing(),
      },
      {
        name: "List",
        description: "リスト",
        parameter: Maybe.Just(typeType),
      },
      {
        name: "Maybe",
        description: "Maybe",
        parameter: Maybe.Just(typeType),
      },
      {
        name: "Result",
        description: "Result",
        parameter: Maybe.Just(resultTypeType),
      },
      {
        name: "Id",
        description:
          "データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字",
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "Token",
        description:
          "データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字",
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "Custom",
        description: "用意されていないアプリ特有の型",
        parameter: Maybe.Just(Type.String),
      },
      {
        name: "Parameter",
        description: "型パラメーター",
        parameter: Maybe.Just(Type.String),
      },
    ]),
  },
  {
    name: resultTypeName,
    typeParameterList: [],
    description: "正常値と異常値",
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
    name: urlDataName,
    typeParameterList: [],
    description:
      "デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる",
    body: CustomTypeDefinitionBody.Product([
      {
        name: "clientMode",
        description: "クライアントモード",
        type: clientModeType,
      },
      {
        name: "location",
        description: "場所",
        type: locationType,
      },
      {
        name: "language",
        description: "言語",
        type: languageType,
      },
      {
        name: "accessToken",
        description:
          "アクセストークン. ログインした後のリダイレクト先としてサーバーから渡される",
        type: Type.Maybe(accessToken),
      },
      {
        name: "if",
        description: "予約語をこっそり入れてみる",
        type: Type.Bool,
      },
    ]),
  },
  {
    name: clientModeName,
    typeParameterList: [],
    description: "デバッグの状態と, デバッグ時ならアクセスしているポート番号",
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "DebugMode",
        description:
          "デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの",
        parameter: Maybe.Just(Type.Int32),
      },
      {
        name: "Release",
        description: "リリースモード. https://definy.app ",
        parameter: Maybe.Nothing(),
      },
    ]),
  },
  {
    name: locationName,
    typeParameterList: [],
    description:
      "DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる",
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Home",
        description: "最初のページ",
        parameter: Maybe.Nothing(),
      },
      {
        name: "User",
        description: "ユーザーの詳細ページ",
        parameter: Maybe.Just(Type.Id("UserId")),
      },
      {
        name: "Project",
        description: "プロジェクトの詳細ページ",
        parameter: Maybe.Just(Type.Id("ProjectId")),
      },
    ]),
  },
  {
    name: languageName,
    typeParameterList: [],
    description: "英語,日本語,エスペラント語などの言語",
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "Japanese",
        description: "日本語",
        parameter: Maybe.Nothing(),
      },
      {
        name: "English",
        description: "英語",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Esperanto",
        description: "エスペラント語",
        parameter: Maybe.Nothing(),
      },
    ]),
  },
  {
    name: projectName,
    typeParameterList: [],
    description: "プロジェクト",
    body: CustomTypeDefinitionBody.Product([
      {
        name: "name",
        description: "プロジェクト名",
        type: Type.String,
      },
      {
        name: "icon",
        description: "プロジェクトのアイコン画像",
        type: fileHash,
      },
      {
        name: "image",
        description: "プロジェクトのカバー画像",
        type: fileHash,
      },
    ]),
  },
  {
    name: responseWithIdName,
    typeParameterList: ["id", "data"],
    description:
      "Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス",
    body: CustomTypeDefinitionBody.Product([
      {
        name: "id",
        description: "リクエストしたリソースのID",
        type: Type.Parameter("id"),
      },
      {
        name: "response",
        description: "レスポンス",
        type: responseType(Type.Parameter("data")),
      },
    ]),
  },
  {
    name: responseName,
    typeParameterList: ["data"],
    description: "リソースをリクエストしたあとのレスポンス",
    body: CustomTypeDefinitionBody.Sum([
      {
        name: "ConnectionError",
        description: "オフラインかサーバー上でエラーが発生しました",
        parameter: Maybe.Nothing(),
      },
      {
        name: "NotFound",
        description: "リソースが存在しない",
        parameter: Maybe.Nothing(),
      },
      {
        name: "Found",
        description: "取得に成功した",
        parameter: Maybe.Just(Type.Parameter("data")),
      },
    ]),
  },
];

const typeDefinitionTypeScriptCode = generator.generateCodeAsString(
  nType.generateTypeScriptCode(customTypeList),
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
      require("../../testOutJs/testOut/main.js");
    });
});
