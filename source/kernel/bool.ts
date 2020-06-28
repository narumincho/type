import * as c from "./codec";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

const name = identifer.fromString("Bool");

export const type: ts.Type = ts.typeBoolean;

export const codec = (): ts.Expr =>
  ts.get(ts.variable(name), util.codecPropertyName);

export const variableDefinition = (): ts.Variable =>
  c.variableDefinition(
    name,
    type,
    "Bool. 真か偽. JavaScriptのbooleanで扱える",
    "true: 1, false: 0. (1byte)としてバイナリに変換する",
    encodeDefinition(),
    decodeDefinition()
  );

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
