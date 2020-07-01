import * as c from "./codec";
import * as int32 from "./int32";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const name = identifer.fromString("List");

export const type = (element: ts.Type): ts.Type =>
  ts.readonlyArrayType(element);

const elementTypeName = identifer.fromString("element");
const elementCodecName = identifer.fromString("elementCodec");
const elementCodecVar = ts.Expr.Variable(elementCodecName);
const elementType = ts.Type.ScopeInFile(elementTypeName);

export const variableDefinition = (): ts.Variable => ({
  name,
  document: "リスト. JavaScriptのArrayで扱う",
  type: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          required: true,
          type: c.codecTypeWithTypeParameter(
            ts.typeScopeInGlobal(identifer.fromString("ReadonlyArray")),
            ["element"]
          ),
          document: "",
        },
      ],
    ])
  ),
  expr: ts.Expr.ObjectLiteral([
    ts.Member.KeyValue(
      util.codecPropertyName,
      ts.lambda(
        [
          {
            name: elementCodecName,
            type: c.codecType(elementType),
          },
        ],
        [elementTypeName],
        c.codecType(type(elementType)),
        [
          ts.Statement.Return(
            ts.Expr.ObjectLiteral([
              ts.Member.KeyValue(util.encodePropertyName, encodeDefinition()),
              ts.Member.KeyValue(util.decodePropertyName, decodeDefinition()),
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
    type(ts.Type.ScopeInFile(elementTypeName)),
    (valueVar) => [
      ts.statementLetVariableDefinition(
        resultName,
        ts.arrayType(ts.Type.Number),
        ts.typeAssertion(
          int32.encode(ts.get(valueVar, "length")),
          ts.arrayType(ts.Type.Number)
        )
      ),
      ts.statementForOf(elementName, valueVar, [
        ts.statementSet(
          ts.Expr.Variable(resultName),
          null,
          ts.callMethod(ts.Expr.Variable(resultName), "concat", [
            ts.call(ts.get(elementCodecVar, util.encodePropertyName), [
              ts.Expr.Variable(elementName),
            ]),
          ])
        ),
      ]),
      ts.Statement.Return(ts.Expr.Variable(resultName)),
    ]
  );
};

const decodeDefinition = (): ts.Expr => {
  const elementTypeVar = ts.Type.ScopeInFile(elementTypeName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);
  const lengthResultName = identifer.fromString("lengthResult");
  const lengthResultVar = ts.Expr.Variable(lengthResultName);
  const resultAndNextIndexName = identifer.fromString("resultAndNextIndex");
  const resultAndNextIndexVar = ts.Expr.Variable(resultAndNextIndexName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.Expr.Variable(nextIndexName);

  return c.decodeLambda(
    ts.readonlyArrayType(elementTypeVar),
    (parameterIndex, parameterBinary) => [
      ts.statementVariableDefinition(
        lengthResultName,
        c.decodeReturnType(ts.Type.Number),
        int32.decode(parameterIndex, parameterBinary)
      ),
      ts.statementLetVariableDefinition(
        nextIndexName,
        ts.Type.Number,
        c.getNextIndex(lengthResultVar)
      ),
      ts.statementVariableDefinition(
        resultName,
        ts.arrayType(elementTypeVar),
        ts.Expr.ArrayLiteral([])
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
      c.returnStatement(resultVar, nextIndexVar),
    ]
  );
};
