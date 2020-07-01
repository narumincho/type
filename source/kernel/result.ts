import {
  CustomTypeDefinition,
  CustomTypeDefinitionBody,
  Maybe,
  Type,
} from "../data";
import { identifer, data as ts } from "js-ts-code-generator";

const name = "Result";

export const type = (okType: ts.Type, errorType: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.Type.ScopeInFile(identifer.fromString(name)), [
    okType,
    errorType,
  ]);

export const customTypeDefinition: CustomTypeDefinition = {
  name,
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
