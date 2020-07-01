import * as c from "./codec";
import * as int32 from "./int32";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

export const name = identifer.fromString("List");

export const type = (element: ts.Type): ts.Type =>
  tsUtil.readonlyArrayType(element);

const elementTypeName = identifer.fromString("element");
const elementCodecName = identifer.fromString("elementCodec");
const elementCodecVar = ts.Expr.Variable(elementCodecName);
const elementType = ts.Type.ScopeInFile(elementTypeName);

export const variableDefinition = (): ts.Variable => ({
  name,
  document: "リスト. JavaScriptのArrayで扱う",
  type: ts.Type.Object([
    {
      name: util.codecPropertyName,
      required: true,
      type: c.codecTypeWithTypeParameter(
        ts.Type.ScopeInGlobal(identifer.fromString("ReadonlyArray")),
        ["element"]
      ),
      document: "",
    },
  ]),
  expr: ts.Expr.ObjectLiteral([
    ts.Member.KeyValue({
      key: util.codecPropertyName,
      value: ts.Expr.Lambda({
        typeParameterList: [elementTypeName],
        parameterList: [
          {
            name: elementCodecName,
            type: c.codecType(elementType),
          },
        ],
        returnType: c.codecType(type(elementType)),
        statementList: [
          ts.Statement.Return(
            ts.Expr.ObjectLiteral([
              ts.Member.KeyValue({
                key: util.encodePropertyName,
                value: encodeDefinition(),
              }),
              ts.Member.KeyValue({
                key: util.decodePropertyName,
                value: decodeDefinition(),
              }),
            ])
          ),
        ],
      }),
    }),
  ]),
});

const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const elementName = identifer.fromString("element");

  return c.encodeLambda(
    type(ts.Type.ScopeInFile(elementTypeName)),
    (valueVar) => [
      ts.Statement.VariableDefinition({
        isConst: false,
        name: resultName,
        type: tsUtil.arrayType(ts.Type.Number),
        expr: ts.Expr.TypeAssertion({
          expr: int32.encode(tsUtil.get(valueVar, "length")),
          type: tsUtil.arrayType(ts.Type.Number),
        }),
      }),
      ts.Statement.ForOf({
        elementVariableName: elementName,
        iterableExpr: valueVar,
        statementList: [
          ts.Statement.Set({
            target: ts.Expr.Variable(resultName),
            operatorMaybe: ts.Maybe.Nothing(),
            expr: tsUtil.callMethod(ts.Expr.Variable(resultName), "concat", [
              ts.Expr.Call({
                expr: tsUtil.get(elementCodecVar, util.encodePropertyName),
                parameterList: [ts.Expr.Variable(elementName)],
              }),
            ]),
          }),
        ],
      }),
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
    tsUtil.readonlyArrayType(elementTypeVar),
    (parameterIndex, parameterBinary) => [
      ts.Statement.VariableDefinition({
        isConst: true,
        name: lengthResultName,
        type: c.decodeReturnType(ts.Type.Number),
        expr: int32.decode(parameterIndex, parameterBinary),
      }),
      ts.Statement.VariableDefinition({
        isConst: false,
        name: nextIndexName,
        type: ts.Type.Number,
        expr: c.getNextIndex(lengthResultVar),
      }),
      ts.Statement.VariableDefinition({
        isConst: true,
        name: resultName,
        type: tsUtil.arrayType(elementTypeVar),
        expr: ts.Expr.ArrayLiteral([]),
      }),
      ts.Statement.For({
        counterVariableName: identifer.fromString("i"),
        untilExpr: c.getResult(lengthResultVar),
        statementList: [
          ts.Statement.VariableDefinition({
            isConst: true,
            name: resultAndNextIndexName,
            type: c.decodeReturnType(elementTypeVar),
            expr: ts.Expr.Call({
              expr: tsUtil.get(elementCodecVar, util.decodePropertyName),
              parameterList: [nextIndexVar, parameterBinary],
            }),
          }),
          ts.Statement.EvaluateExpr(
            tsUtil.callMethod(resultVar, "push", [
              c.getResult(resultAndNextIndexVar),
            ])
          ),
          ts.Statement.Set({
            target: nextIndexVar,
            operatorMaybe: ts.Maybe.Nothing(),
            expr: c.getNextIndex(resultAndNextIndexVar),
          }),
        ],
      }),
      c.returnStatement(resultVar, nextIndexVar),
    ]
  );
};
