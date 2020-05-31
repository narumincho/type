import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";
import * as int32 from "./int32";

export const name = identifer.fromString("List");

export const type = (element: ts.Type): ts.Type =>
  ts.readonlyArrayType(element);

const elementTypeName = identifer.fromString("element");
const elementCodecName = identifer.fromString("elementCodec");
const elementCodecVar = ts.variable(elementCodecName);
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
  const parameterListName = identifer.fromString("list");
  const parameterListVar = ts.variable(parameterListName);
  const resultName = identifer.fromString("result");
  const elementName = identifer.fromString("element");

  return ts.lambda(
    [
      {
        name: parameterListName,
        type_: type(ts.typeScopeInFile(elementTypeName)),
      },
    ],
    [],
    c.encodeReturnType,
    [
      ts.statementLetVariableDefinition(
        resultName,
        ts.arrayType(ts.typeNumber),
        ts.typeAssertion(
          int32.encode(true, ts.get(parameterListVar, "length")),
          ts.arrayType(ts.typeNumber)
        )
      ),
      ts.statementForOf(elementName, parameterListVar, [
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

  return ts.lambda(
    c.decodeParameterList,
    [],
    c.decodeReturnType(ts.readonlyArrayType(elementTypeVar)),
    [
      ts.statementVariableDefinition(
        lengthResultName,
        c.decodeReturnType(ts.typeNumber),
        int32.decode(true, c.parameterIndex, c.parameterBinary)
      ),
      ts.statementSet(c.parameterIndex, null, c.getNextIndex(lengthResultVar)),
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
            c.parameterIndex,
            c.parameterBinary,
          ])
        ),
        ts.statementEvaluateExpr(
          ts.callMethod(resultVar, "push", [c.getResult(resultAndNextIndexVar)])
        ),
        ts.statementSet(
          c.parameterIndex,
          null,
          c.getNextIndex(resultAndNextIndexVar)
        ),
      ]),
      c.returnStatement(resultVar, c.parameterIndex),
    ]
  );
};
