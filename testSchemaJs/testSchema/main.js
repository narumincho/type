"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-require-imports */
const fileSystem = require("fs");
const generator = require("js-ts-code-generator");
const nType = require("../source/main");
const prettier = require("prettier");
const ts = require("typescript");
const data_1 = require("../source/data");
const fileHash = data_1.Type.Token("FileHash");
const typeName = "Type";
const typeType = data_1.Type.Custom({ name: typeName, parameterList: [] });
const resultTypeName = "ResultType";
const resultTypeType = data_1.Type.Custom({
    name: resultTypeName,
    parameterList: [],
});
const accessToken = data_1.Type.Token("AccessToken");
const urlDataName = "UrlData";
const clientModeName = "ClientMode";
const clientModeType = data_1.Type.Custom({
    name: clientModeName,
    parameterList: [],
});
const locationName = "Location";
const locationType = data_1.Type.Custom({ name: locationName, parameterList: [] });
const languageName = "Language";
const languageType = data_1.Type.Custom({ name: languageName, parameterList: [] });
const projectName = "Project";
const responseWithIdName = "ResponseWithId";
const responseName = "Response";
const responseType = (type_) => data_1.Type.Custom({ name: responseName, parameterList: [type_] });
const userName = "User";
const userType = data_1.Type.Custom({ name: userName, parameterList: [] });
const customTypeList = [
    {
        name: typeName,
        typeParameterList: [],
        description: "型",
        body: data_1.CustomTypeDefinitionBody.Sum([
            {
                name: "Int",
                description: "-9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "String",
                description: "文字列",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "Bool",
                description: "真偽値",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "List",
                description: "リスト",
                parameter: data_1.Maybe.Just(typeType),
            },
            {
                name: "Maybe",
                description: "Maybe",
                parameter: data_1.Maybe.Just(typeType),
            },
            {
                name: "Result",
                description: "Result",
                parameter: data_1.Maybe.Just(resultTypeType),
            },
            {
                name: "Id",
                description: "データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字",
                parameter: data_1.Maybe.Just(data_1.Type.String),
            },
            {
                name: "Token",
                description: "データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字",
                parameter: data_1.Maybe.Just(data_1.Type.String),
            },
            {
                name: "Custom",
                description: "用意されていないアプリ特有の型",
                parameter: data_1.Maybe.Just(data_1.Type.String),
            },
            {
                name: "Parameter",
                description: "型パラメーター",
                parameter: data_1.Maybe.Just(data_1.Type.String),
            },
        ]),
    },
    {
        name: resultTypeName,
        typeParameterList: [],
        description: "正常値と異常値",
        body: data_1.CustomTypeDefinitionBody.Product([
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
        description: "デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる",
        body: data_1.CustomTypeDefinitionBody.Product([
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
                description: "アクセストークン. ログインした後のリダイレクト先としてサーバーから渡される",
                type: data_1.Type.Maybe(accessToken),
            },
            {
                name: "if",
                description: "予約語をこっそり入れてみる",
                type: data_1.Type.Bool,
            },
        ]),
    },
    {
        name: clientModeName,
        typeParameterList: [],
        description: "デバッグの状態と, デバッグ時ならアクセスしているポート番号",
        body: data_1.CustomTypeDefinitionBody.Sum([
            {
                name: "DebugMode",
                description: "デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの",
                parameter: data_1.Maybe.Just(data_1.Type.Int32),
            },
            {
                name: "Release",
                description: "リリースモード. https://definy.app ",
                parameter: data_1.Maybe.Nothing(),
            },
        ]),
    },
    {
        name: locationName,
        typeParameterList: [],
        description: "DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる",
        body: data_1.CustomTypeDefinitionBody.Sum([
            {
                name: "Home",
                description: "最初のページ",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "User",
                description: "ユーザーの詳細ページ",
                parameter: data_1.Maybe.Just(data_1.Type.Id("UserId")),
            },
            {
                name: "Project",
                description: "プロジェクトの詳細ページ",
                parameter: data_1.Maybe.Just(data_1.Type.Id("ProjectId")),
            },
        ]),
    },
    {
        name: languageName,
        typeParameterList: [],
        description: "英語,日本語,エスペラント語などの言語",
        body: data_1.CustomTypeDefinitionBody.Sum([
            {
                name: "Japanese",
                description: "日本語",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "English",
                description: "英語",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "Esperanto",
                description: "エスペラント語",
                parameter: data_1.Maybe.Nothing(),
            },
        ]),
    },
    {
        name: projectName,
        typeParameterList: [],
        description: "プロジェクト",
        body: data_1.CustomTypeDefinitionBody.Product([
            {
                name: "name",
                description: "プロジェクト名",
                type: data_1.Type.String,
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
        description: "Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス",
        body: data_1.CustomTypeDefinitionBody.Product([
            {
                name: "id",
                description: "リクエストしたリソースのID",
                type: data_1.Type.Parameter("id"),
            },
            {
                name: "response",
                description: "レスポンス",
                type: responseType(data_1.Type.Parameter("data")),
            },
        ]),
    },
    {
        name: responseName,
        typeParameterList: ["data"],
        description: "リソースをリクエストしたあとのレスポンス",
        body: data_1.CustomTypeDefinitionBody.Sum([
            {
                name: "ConnectionError",
                description: "オフラインかサーバー上でエラーが発生しました",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "NotFound",
                description: "リソースが存在しない",
                parameter: data_1.Maybe.Nothing(),
            },
            {
                name: "Found",
                description: "取得に成功した",
                parameter: data_1.Maybe.Just(data_1.Type.Parameter("data")),
            },
        ]),
    },
    {
        name: userName,
        description: "ユーザー",
        typeParameterList: [],
        body: data_1.CustomTypeDefinitionBody.Product([
            {
                name: "name",
                description: "ユーザー名. 表示される名前. 他のユーザーとかぶっても良い. 絵文字も使える. 全角英数は半角英数,半角カタカナは全角カタカナ, (株)の合字を分解するなどのNFKCの正規化がされる. U+0000-U+0019 と U+007F-U+00A0 の範囲の文字は入らない. 前後に空白を含められない. 間の空白は2文字以上連続しない. 文字数のカウント方法は正規化されたあとのCodePoint単位. Twitterと同じ, 1文字以上50文字以下",
                type: data_1.Type.String,
            },
            {
                name: "imageHash",
                description: "プロフィール画像",
                type: fileHash,
            },
            {
                name: "introduction",
                description: "自己紹介文. 改行文字を含めることができる. Twitterと同じ 0～160文字",
                type: data_1.Type.String,
            },
        ]),
    },
];
const typeDefinitionTypeScriptCode = generator.generateCodeAsString(nType.generateTypeScriptCode(customTypeList), "TypeScript");
const testOutFolderName = "testOut";
const typeScriptPath = testOutFolderName + "/out.ts";
fileSystem.mkdir(testOutFolderName, () => {
    fileSystem.promises
        .writeFile(typeScriptPath, prettier.format(typeDefinitionTypeScriptCode, { parser: "typescript" }))
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
        require("../../testJs/test/main.js");
    });
});
