import * as util from "../util";
import {
  CustomTypeDefinition,
  CustomTypeDefinitionBody,
  Maybe,
  Type,
} from "../data";
import { identifer, data as ts } from "js-ts-code-generator";

const name = "Maybe";

export const type = (elementType: ts.Type, widthKernel: boolean): ts.Type =>
  widthKernel
    ? ts.typeWithParameter(ts.typeScopeInFile(identifer.fromString(name)), [
        elementType,
      ])
    : ts.typeWithParameter(
        ts.typeImported(util.moduleName, identifer.fromString(name)),
        [elementType]
      );

export const customTypeDefinition: CustomTypeDefinition = {
  name,
  typeParameterList: ["value"],
  description:
    "Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  body: CustomTypeDefinitionBody.Sum([
    {
      name: "Just",
      description: "値があるということ",
      parameter: Maybe.Just(Type.Parameter("value")),
    },
    {
      name: "Nothing",
      description: "値がないということ",
      parameter: Maybe.Nothing(),
    },
  ]),
};
