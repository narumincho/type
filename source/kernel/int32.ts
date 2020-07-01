import * as c from "./codec";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

const name = identifer.fromString("Int32");

export const type = ts.Type.Number;

export const codec = (): ts.Expr =>
  ts.get(ts.Expr.Variable(name), util.codecPropertyName);

export const encode = (target: ts.Expr): ts.Expr =>
  ts.call(ts.get(codec(), util.encodePropertyName), [target]);

export const decode = (index: ts.Expr, binary: ts.Expr): ts.Expr =>
  ts.call(ts.get(codec(), util.decodePropertyName), [index, binary]);

export const variableDefinition = (): ts.Variable =>
  c.variableDefinition(
    name,
    type,
    "-2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う",
    "numberの32bit符号あり整数をSigned Leb128のバイナリに変換する",
    encodeDefinition(),
    decodeDefinition()
  );

/**
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換するコード
 */
const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.Expr.Variable(byteName);
  const restName = identifer.fromString("rest");
  const restVar = ts.Expr.Variable(restName);

  return c.encodeLambda(type, (valueVar) => [
    ts.statementLetVariableDefinition(
      restName,
      ts.Type.Number,
      ts.bitwiseOr(valueVar, ts.Expr.NumberLiteral(0))
    ),
    ts.statementVariableDefinition(
      resultName,
      ts.arrayType(ts.Type.Number),
      ts.Expr.ArrayLiteral([])
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        byteName,
        ts.Type.Number,
        ts.bitwiseAnd(restVar, ts.Expr.NumberLiteral(0x7f))
      ),
      ts.statementSet(restVar, ">>", ts.Expr.NumberLiteral(7)),
      ts.statementIf(
        ts.logicalOr(
          ts.logicalAnd(
            ts.equal(restVar, ts.Expr.NumberLiteral(0)),
            ts.equal(
              ts.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
              ts.Expr.NumberLiteral(0)
            )
          ),
          ts.logicalAnd(
            ts.equal(restVar, ts.Expr.NumberLiteral(-1)),
            ts.notEqual(
              ts.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
              ts.Expr.NumberLiteral(0)
            )
          )
        ),
        [
          ts.statementEvaluateExpr(ts.callMethod(resultVar, "push", [byteVar])),
          ts.Statement.Return(resultVar),
        ]
      ),
      ts.statementEvaluateExpr(
        ts.callMethod(resultVar, "push", [
          ts.bitwiseOr(byteVar, ts.Expr.NumberLiteral(0x80)),
        ])
      ),
    ]),
  ]);
};

export const decodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);
  const offsetName = identifer.fromString("offset");
  const offsetVar = ts.Expr.Variable(offsetName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.Expr.Variable(byteName);

  return c.decodeLambda(ts.Type.Number, (parameterIndex, parameterBinary) => [
    ts.statementLetVariableDefinition(
      resultName,
      ts.Type.Number,
      ts.Expr.NumberLiteral(0)
    ),
    ts.statementLetVariableDefinition(
      offsetName,
      ts.Type.Number,
      ts.Expr.NumberLiteral(0)
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        byteName,
        ts.Type.Number,
        ts.getByExpr(parameterBinary, ts.addition(parameterIndex, offsetVar))
      ),
      ts.statementSet(
        resultVar,
        "|",
        ts.leftShift(
          ts.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x7f)),
          ts.multiplication(offsetVar, ts.Expr.NumberLiteral(7))
        )
      ),
      ts.statementSet(offsetVar, "+", ts.Expr.NumberLiteral(1)),
      ts.statementIf(
        ts.equal(
          ts.bitwiseAnd(ts.Expr.NumberLiteral(0x80), byteVar),
          ts.Expr.NumberLiteral(0)
        ),
        [
          ts.statementIf(
            ts.logicalAnd(
              ts.lessThan(
                ts.multiplication(offsetVar, ts.Expr.NumberLiteral(7)),
                ts.Expr.NumberLiteral(32)
              ),
              ts.notEqual(
                ts.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
                ts.Expr.NumberLiteral(0)
              )
            ),
            [
              c.returnStatement(
                ts.bitwiseOr(
                  resultVar,
                  ts.leftShift(
                    ts.bitwiseNot(ts.Expr.NumberLiteral(0)),
                    ts.multiplication(offsetVar, ts.Expr.NumberLiteral(7))
                  )
                ),
                ts.addition(parameterIndex, offsetVar)
              ),
            ]
          ),
          c.returnStatement(resultVar, ts.addition(parameterIndex, offsetVar)),
        ]
      ),
    ]),
  ]);
};
