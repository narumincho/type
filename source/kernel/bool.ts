import * as c from "./codec";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

const name = identifer.fromString("Bool");

export const type: ts.Type = ts.Type.Boolean;

export const codec = (): ts.Expr =>
  tsUtil.get(ts.Expr.Variable(name), util.codecPropertyName);

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
    ts.Statement.Return(
      ts.Expr.ArrayLiteral([
        {
          expr: ts.Expr.ConditionalOperator({
            condition: valueVar,
            thenExpr: ts.Expr.NumberLiteral(1),
            elseExpr: ts.Expr.NumberLiteral(0),
          }),
          spread: false,
        },
      ])
    ),
  ]);

const decodeDefinition = (): ts.Expr =>
  c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    c.returnStatement(
      tsUtil.notEqual(
        ts.Expr.Get({ expr: parameterBinary, propertyExpr: parameterIndex }),
        ts.Expr.NumberLiteral(0)
      ),
      tsUtil.addition(parameterIndex, ts.Expr.NumberLiteral(1))
    ),
  ]);
