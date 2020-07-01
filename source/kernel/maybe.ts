import * as ts from "js-ts-code-generator/distribution/newData";
import {
  CustomTypeDefinition,
  CustomTypeDefinitionBody,
  Maybe,
  Type,
} from "../data";
import { identifer } from "js-ts-code-generator";

const name = "Maybe";

export const type = (elementType: ts.Type): ts.Type =>
  ts.Type.WithTypeParameter({
    type: ts.Type.ScopeInFile(identifer.fromString(name)),
    typeParameterList: [elementType],
  });

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
