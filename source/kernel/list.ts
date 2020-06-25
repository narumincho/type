import * as c from "./codec";
import * as int32 from "./int32";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const name = identifer.fromString("List");

export const type = (element: ts.Type): ts.Type =>
  ts.readonlyArrayType(element);

const elementTypeName = identifer.fromString("element");
const elementCodecName = identifer.fromString("elementCodec");
const elementCodecVar = ts.variable(elementCodecName);
const elementType = ts.typeScopeInFile(elementTypeName);

export const variableDefinition = (): ts.Variable => ({
  name,
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
  expr: ts.objectLiteral([
    ts.memberKeyValue(
      util.codecPropertyName,
      ts.lambda(
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
              ts.memberKeyValue(util.encodePropertyName, encodeDefinition()),
              ts.memberKeyValue(util.decodePropertyName, decodeDefinition()),
            ])
          ),
        ]
      )
    ),
  ]),
});

const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const elementName = identifer.fromString("element");

  return c.encodeLambda(
    type(ts.typeScopeInFile(elementTypeName)),
    (valueVar) => [
      ts.statementLetVariableDefinition(
        resultName,
        ts.arrayType(ts.typeNumber),
        ts.typeAssertion(
          int32.encode(true, ts.get(valueVar, "length")),
          ts.arrayType(ts.typeNumber)
        )
      ),
      ts.statementForOf(elementName, valueVar, [
        ts.statementSet(
          ts.variable(resultName),
          null,
          ts.callMethod(ts.variable(resultName), "concat", [
            ts.call(ts.get(elementCodecVar, util.encodePropertyName), [
              ts.variable(elementName),
            ]),
          ])
        ),
      ]),
      ts.statementReturn(ts.variable(resultName)),
    ]
  );
};

const decodeDefinition = (): ts.Expr => {
  const elementTypeVar = ts.typeScopeInFile(elementTypeName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const lengthResultName = identifer.fromString("lengthResult");
  const lengthResultVar = ts.variable(lengthResultName);
  const resultAndNextIndexName = identifer.fromString("resultAndNextIndex");
  const resultAndNextIndexVar = ts.variable(resultAndNextIndexName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.variable(nextIndexName);

  return c.decodeLambda(
    ts.readonlyArrayType(elementTypeVar),
    (parameterIndex, parameterBinary) => [
      ts.statementVariableDefinition(
        lengthResultName,
        c.decodeReturnType(ts.typeNumber),
        int32.decode(true, parameterIndex, parameterBinary)
      ),
      ts.statementLetVariableDefinition(
        nextIndexName,
        ts.typeNumber,
        c.getNextIndex(lengthResultVar)
      ),
      ts.statementVariableDefinition(
        resultName,
        ts.arrayType(elementTypeVar),
        ts.arrayLiteral([])
      ),
      ts.statementFor(identifer.fromString("i"), c.getResult(lengthResultVar), [
        ts.statementVariableDefinition(
          resultAndNextIndexName,
          c.decodeReturnType(elementTypeVar),
          ts.call(ts.get(elementCodecVar, util.decodePropertyName), [
            nextIndexVar,
            parameterBinary,
          ])
        ),
        ts.statementEvaluateExpr(
          ts.callMethod(resultVar, "push", [c.getResult(resultAndNextIndexVar)])
        ),
        ts.statementSet(
          nextIndexVar,
          null,
          c.getNextIndex(resultAndNextIndexVar)
        ),
      ]),
      c.returnStatement(resultVar, parameterIndex),
    ]
  );
};
