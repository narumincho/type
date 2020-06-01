import { data as ts, identifer } from "js-ts-code-generator";
import {
  Maybe,
  CustomTypeDefinitionBody,
  Type,
  CustomTypeDefinition,
} from "../data";
import * as util from "../util";

const name = "Result";

export const type = (
  okType: ts.Type,
  errorType: ts.Type,
  withKernel: boolean
): ts.Type =>
  withKernel
    ? ts.typeWithParameter(ts.typeScopeInFile(identifer.fromString(name)), [
        okType,
        errorType,
      ])
    : ts.typeWithParameter(
        ts.typeImported(util.moduleName, identifer.fromString(name)),
        [okType, errorType]
      );

export const customTypeDefinition: CustomTypeDefinition = {
  name: name,
  description:
    "成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  typeParameterList: ["ok", "error"],
  body: CustomTypeDefinitionBody.Sum([
    {
      name: "Ok",
      description: "成功",
      parameter: Maybe.Just(Type.Parameter("ok")),
    },
    {
      name: "Error",
      description: "失敗",
      parameter: Maybe.Just(Type.Parameter("error")),
    },
  ]),
};
