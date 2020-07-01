import * as c from "./codec";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

const name = identifer.fromString("Int32");

export const type = ts.Type.Number;

export const codec = (): ts.Expr =>
  tsUtil.get(ts.Expr.Variable(name), util.codecPropertyName);

export const encode = (target: ts.Expr): ts.Expr =>
  ts.Expr.Call({
    expr: tsUtil.get(codec(), util.encodePropertyName),
    parameterList: [target],
  });

export const decode = (index: ts.Expr, binary: ts.Expr): ts.Expr =>
  ts.Expr.Call({
    expr: tsUtil.get(codec(), util.decodePropertyName),
    parameterList: [index, binary],
  });

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
    ts.Statement.VariableDefinition({
      isConst: false,
      name: restName,
      type: ts.Type.Number,
      expr: tsUtil.bitwiseOr(valueVar, ts.Expr.NumberLiteral(0)),
    }),
    ts.Statement.VariableDefinition({
      isConst: true,
      name: resultName,
      type: tsUtil.arrayType(ts.Type.Number),
      expr: ts.Expr.ArrayLiteral([]),
    }),
    ts.Statement.WhileTrue([
      ts.Statement.VariableDefinition({
        isConst: true,
        name: byteName,
        type: ts.Type.Number,
        expr: tsUtil.bitwiseAnd(restVar, ts.Expr.NumberLiteral(0x7f)),
      }),
      ts.Statement.Set({
        target: restVar,
        operatorMaybe: ts.Maybe.Just<ts.BinaryOperator>("SignedRightShift"),
        expr: ts.Expr.NumberLiteral(7),
      }),
      ts.Statement.If({
        condition: tsUtil.logicalOr(
          tsUtil.logicalAnd(
            tsUtil.equal(restVar, ts.Expr.NumberLiteral(0)),
            tsUtil.equal(
              tsUtil.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
              ts.Expr.NumberLiteral(0)
            )
          ),
          tsUtil.logicalAnd(
            tsUtil.equal(restVar, ts.Expr.NumberLiteral(-1)),
            tsUtil.notEqual(
              tsUtil.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
              ts.Expr.NumberLiteral(0)
            )
          )
        ),
        thenStatementList: [
          ts.Statement.EvaluateExpr(
            tsUtil.callMethod(resultVar, "push", [byteVar])
          ),
          ts.Statement.Return(resultVar),
        ],
      }),
      ts.Statement.EvaluateExpr(
        tsUtil.callMethod(resultVar, "push", [
          tsUtil.bitwiseOr(byteVar, ts.Expr.NumberLiteral(0x80)),
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
    ts.Statement.VariableDefinition({
      isConst: false,
      name: resultName,
      type: ts.Type.Number,
      expr: ts.Expr.NumberLiteral(0),
    }),
    ts.Statement.VariableDefinition({
      isConst: false,
      name: offsetName,
      type: ts.Type.Number,
      expr: ts.Expr.NumberLiteral(0),
    }),
    ts.Statement.WhileTrue([
      ts.Statement.VariableDefinition({
        isConst: true,
        name: byteName,
        type: ts.Type.Number,
        expr: ts.Expr.Get({
          expr: parameterBinary,
          propertyExpr: tsUtil.addition(parameterIndex, offsetVar),
        }),
      }),
      ts.Statement.Set({
        target: resultVar,
        operatorMaybe: ts.Maybe.Just<ts.BinaryOperator>("BitwiseOr"),
        expr: tsUtil.leftShift(
          tsUtil.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x7f)),
          tsUtil.multiplication(offsetVar, ts.Expr.NumberLiteral(7))
        ),
      }),
      ts.Statement.Set({
        target: offsetVar,
        operatorMaybe: ts.Maybe.Just<ts.BinaryOperator>("Addition"),
        expr: ts.Expr.NumberLiteral(1),
      }),
      ts.Statement.If({
        condition: tsUtil.equal(
          tsUtil.bitwiseAnd(ts.Expr.NumberLiteral(0x80), byteVar),
          ts.Expr.NumberLiteral(0)
        ),
        thenStatementList: [
          ts.Statement.If({
            condition: tsUtil.logicalAnd(
              tsUtil.lessThan(
                tsUtil.multiplication(offsetVar, ts.Expr.NumberLiteral(7)),
                ts.Expr.NumberLiteral(32)
              ),
              tsUtil.notEqual(
                tsUtil.bitwiseAnd(byteVar, ts.Expr.NumberLiteral(0x40)),
                ts.Expr.NumberLiteral(0)
              )
            ),
            thenStatementList: [
              c.returnStatement(
                tsUtil.bitwiseOr(
                  resultVar,
                  tsUtil.leftShift(
                    tsUtil.bitwiseNot(ts.Expr.NumberLiteral(0)),
                    tsUtil.multiplication(offsetVar, ts.Expr.NumberLiteral(7))
                  )
                ),
                tsUtil.addition(parameterIndex, offsetVar)
              ),
            ],
          }),
          c.returnStatement(
            resultVar,
            tsUtil.addition(parameterIndex, offsetVar)
          ),
        ],
      }),
    ]),
  ]);
};
