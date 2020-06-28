import * as c from "./codec";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

const name = identifer.fromString("Int32");

export const type = ts.typeNumber;

export const codec = (): ts.Expr =>
  ts.get(ts.variable(name), util.codecPropertyName);

export const encode = (target: ts.Expr): ts.Expr =>
  ts.call(ts.get(codec(), util.encodePropertyName), [target]);

export const decode = (index: ts.Expr, binary: ts.Expr): ts.Expr =>
  ts.call(ts.get(codec(), util.decodePropertyName), [index, binary]);

export const variableDefinition = (): ts.Variable => ({
  name,
  document:
    "-2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う",
  type: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type: c.codecType(ts.typeNumber),
          document:
            "numberの32bit符号あり整数をSigned Leb128のバイナリに変換する",
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

/**
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換するコード
 */
const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.variable(byteName);
  const restName = identifer.fromString("rest");
  const restVar = ts.variable(restName);

  return c.encodeLambda(type, (valueVar) => [
    ts.statementLetVariableDefinition(
      restName,
      ts.typeNumber,
      ts.bitwiseOr(valueVar, ts.numberLiteral(0))
    ),
    ts.statementVariableDefinition(
      resultName,
      ts.arrayType(ts.typeNumber),
      ts.arrayLiteral([])
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        byteName,
        ts.typeNumber,
        ts.bitwiseAnd(restVar, ts.numberLiteral(0x7f))
      ),
      ts.statementSet(restVar, ">>", ts.numberLiteral(7)),
      ts.statementIf(
        ts.logicalOr(
          ts.logicalAnd(
            ts.equal(restVar, ts.numberLiteral(0)),
            ts.equal(
              ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
              ts.numberLiteral(0)
            )
          ),
          ts.logicalAnd(
            ts.equal(restVar, ts.numberLiteral(-1)),
            ts.notEqual(
              ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
              ts.numberLiteral(0)
            )
          )
        ),
        [
          ts.statementEvaluateExpr(ts.callMethod(resultVar, "push", [byteVar])),
          ts.statementReturn(resultVar),
        ]
      ),
      ts.statementEvaluateExpr(
        ts.callMethod(resultVar, "push", [
          ts.bitwiseOr(byteVar, ts.numberLiteral(0x80)),
        ])
      ),
    ]),
  ]);
};

export const decodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const offsetName = identifer.fromString("offset");
  const offsetVar = ts.variable(offsetName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.variable(byteName);

  return c.decodeLambda(ts.typeNumber, (parameterIndex, parameterBinary) => [
    ts.statementLetVariableDefinition(
      resultName,
      ts.typeNumber,
      ts.numberLiteral(0)
    ),
    ts.statementLetVariableDefinition(
      offsetName,
      ts.typeNumber,
      ts.numberLiteral(0)
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        byteName,
        ts.typeNumber,
        ts.getByExpr(parameterBinary, ts.addition(parameterIndex, offsetVar))
      ),
      ts.statementSet(
        resultVar,
        "|",
        ts.leftShift(
          ts.bitwiseAnd(byteVar, ts.numberLiteral(0x7f)),
          ts.multiplication(offsetVar, ts.numberLiteral(7))
        )
      ),
      ts.statementSet(offsetVar, "+", ts.numberLiteral(1)),
      ts.statementIf(
        ts.equal(
          ts.bitwiseAnd(ts.numberLiteral(0x80), byteVar),
          ts.numberLiteral(0)
        ),
        [
          ts.statementIf(
            ts.logicalAnd(
              ts.lessThan(
                ts.multiplication(offsetVar, ts.numberLiteral(7)),
                ts.numberLiteral(32)
              ),
              ts.notEqual(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            ),
            [
              c.returnStatement(
                ts.bitwiseOr(
                  resultVar,
                  ts.leftShift(
                    ts.bitwiseNot(ts.numberLiteral(0)),
                    ts.multiplication(offsetVar, ts.numberLiteral(7))
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
