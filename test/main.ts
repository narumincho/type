import * as t from "../source/main";
import { type } from "../source/main";
import * as generator from "js-ts-code-generator";
import * as fileSystem from "fs";
import * as ts from "typescript";

const typeType: type.CustomType = {
  name: "Type",
  description: "型",
  body: type.customTypeBodySum([
    {
      name: "Int",
      description:
        "-9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲",
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

const language: type.CustomType = {
  name: "Language",
  description: "プログラミング言語",
  body: type.customTypeBodySum([
    {
      name: "TypeScript",
      description: "TypeScript",
      parameter: type.maybeNothing()
    },
    {
      name: "JavaScript",
      description: "JavaScript",
      parameter: type.maybeNothing()
    },
    {
      name: "Elm",
      description: "Elm",
      parameter: type.maybeNothing()
    }
  ])
};

const schema: type.Schema = {
  customTypeList: [typeType, resultTypeType, language],
  idOrTokenTypeNameList: ["UserId", "FileToken"]
};

const typeDefinitionTypeScriptCode = generator.generateCodeAsString(
  t.generateTypeScriptCode(schema),
  "TypeScript"
);
const elmCodeAsString: string = t.elm.generateCode("Data", schema);
const testOutFolderName = "testOut";
const createTypeScriptCode = (): Promise<void> =>
  fileSystem.promises.writeFile(
    testOutFolderName + "/out.ts",
    typeDefinitionTypeScriptCode
  );

const createElmCode = (): Promise<void> =>
  fileSystem.promises.writeFile(
    testOutFolderName + "/out.elm",
    elmCodeAsString
  );

fileSystem.mkdir(testOutFolderName, () => {
  createTypeScriptCode().then(() => {
    ts.createProgram({
      rootNames: [testOutFolderName + "/main.ts"],
      options: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        lib: ["ES2020"],
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        newLine: ts.NewLineKind.LineFeed,
        outDir: "testOutJs",
        strict: true
      }
    }).emit();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../../testOutJs/main.js");
  });
  createElmCode();
});
