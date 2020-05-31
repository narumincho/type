import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";

export const name = identifer.fromString("List");

export const type = (element: ts.Type): ts.Type =>
  ts.readonlyArrayType(element);

const elementTypeName = identifer.fromString("element");
const elementCodecName = identifer.fromString("elementCodec");
const elementType = ts.typeScopeInFile(elementTypeName);

export const exprDefinition = (): ts.Variable => ({
  name: name,
  document: "リスト. JavaScriptのArrayで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: c.codecTypeWithTypeParameter(
            ts.typeScopeInGlobal(identifer.fromString("ReadonlyArray")),
            ["element"],
            true
          ),
          document: "",
        },
      ],
    ])
  ),
  expr: ts.lambda(
    [
      {
        name: elementCodecName,
        type_: c.codecType(elementType, true),
      },
    ],
    [elementTypeName],
    c.codecType(type(elementType), true),
    [
      ts.statementReturn(
        ts.objectLiteral([
          ts.memberKeyValue(
            util.codecPropertyName,
            ts.objectLiteral([
              ts.memberKeyValue(util.encodePropertyName, encodeDefinition()),
              ts.memberKeyValue(util.decodePropertyName, decodeDefinition()),
            ])
          ),
        ])
      ),
    ]
  ),
});

const encodeDefinition = (): ts.Expr => {
  const parameterListName = identifer.fromString("list");
  const parameterListVar = ts.variable(parameterListName);
  const resultName = identifer.fromString("result");
  const elementName = identifer.fromString("element");
  const encodeFunctionName = identifer.fromString("encodeFunction");

  return ts.stringLiteral("listのencodeのコード");
};

const decodeDefinition = (): ts.Expr => {
  return ts.stringLiteral("listのdecodeのコード");
};
