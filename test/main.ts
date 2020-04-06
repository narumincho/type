import * as t from "../source/main";
import { type } from "../source/main";
import * as generator from "js-ts-code-generator";
import * as fileSystem from "fs";
import * as ts from "typescript";
import * as childProcess from "child_process";
import * as prettier from "prettier";

const typeType: type.CustomType = {
  name: "Type",
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
      parameter: type.maybeJust(type.typeCustom("Type")),
    },
    {
      name: "Maybe",
      description: "Maybe",
      parameter: type.maybeJust(type.typeCustom("Type")),
    },
    {
      name: "Result",
      description: "Result",
      parameter: type.maybeJust(type.typeCustom("ResultType")),
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
  ]),
};

const resultTypeType: type.CustomType = {
  name: "ResultType",
  description: "正常値と異常値",
  body: type.customTypeBodyProduct([
    {
      name: "ok",
      description: "正常値",
      memberType: type.typeCustom("Type"),
    },
    {
      name: "error",
      description: "異常値",
      memberType: type.typeCustom("Type"),
    },
  ]),
};

const accessToken = type.typeToken("AccessToken");
const urlDataName = "UrlData";
const clientModeName = "ClientMode";
const locationName = "Location";
const languageName = "Language";

const urlData: type.CustomType = {
  name: urlDataName,
  description:
    "デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる",
  body: type.customTypeBodyProduct([
    {
      name: "clientMode",
      description: "クライアントモード",
      memberType: type.typeCustom(clientModeName),
    },
    {
      name: "location",
      description: "場所",
      memberType: type.typeCustom(locationName),
    },
    {
      name: "language",
      description: "言語",
      memberType: type.typeCustom(languageName),
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
};

const clientMode: type.CustomType = {
  name: clientModeName,
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
};

const location: type.CustomType = {
  name: locationName,
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
};

const language: type.CustomType = {
  name: languageName,
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
};

const fileHash = type.typeToken("FileHash");

const project: type.CustomType = {
  name: "Project",
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
};

const customTypeList: ReadonlyArray<type.CustomType> = [
  typeType,
  resultTypeType,
  language,
  urlData,
  clientMode,
  location,
  project,
];

const typeDefinitionTypeScriptCode = generator.generateCodeAsString(
  t.generateTypeScriptCode(customTypeList),
  "TypeScript"
);
const elmCodeAsString: string = t.generateElmCode("Data", customTypeList);

const testOutFolderName = "testOut";
const typeScriptPath = testOutFolderName + "/out.ts";
const elmPath = testOutFolderName + "/out.elm";

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
  fileSystem.promises.writeFile(elmPath, elmCodeAsString).then(() => {
    console.log("elm output code");
    childProcess.exec("elm-format --yes " + elmPath, () => {
      console.log("elm formatted");
    });
  });
});
