import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";

const name = identifer.fromString("Bool");

export const type: ts.Type = ts.typeBoolean;

export const codec = (withKernel: boolean): ts.Expr =>
  ts.get(
    withKernel ? ts.variable(name) : ts.importedVariable(util.moduleName, name),
    util.codecPropertyName
  );

export const exprDefinition = (): ts.Variable => ({
  name: name,
  document: "Bool. 真か偽. JavaScriptのbooleanで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: c.codecType(type, true),
          document: "true: 1, false: 0. (1byte)としてバイナリに変換する",
        },
      ],
    ])
  ),
  expr: ts.objectLiteral([
    ts.memberKeyValue(
      util.codecPropertyName,
      ts.objectLiteral([
        ts.memberKeyValue(util.encodePropertyName, encodeDefinition()),
        ts.memberKeyValue(util.decodePropertyName, decodeDefinition()),
      ])
    ),
  ]),
});

const encodeDefinition = (): ts.Expr =>
  c.encodeLambda(type, (valueVar) => [
    ts.statementReturn(
      ts.arrayLiteral([
        {
          expr: ts.conditionalOperator(
            valueVar,
            ts.numberLiteral(1),
            ts.numberLiteral(0)
          ),
          spread: false,
        },
      ])
    ),
  ]);

const decodeDefinition = (): ts.Expr =>
  c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    c.returnStatement(
      ts.notEqual(
        ts.getByExpr(parameterBinary, parameterIndex),
        ts.numberLiteral(0)
      ),
      ts.addition(parameterIndex, ts.numberLiteral(1))
    ),
  ]);
