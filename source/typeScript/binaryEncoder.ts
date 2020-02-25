import { expr, typeExpr } from "js-ts-code-generator";

/**
 * `ReadonlyArray<number>`
 * を表現する
 */
const readonlyArrayNumber: typeExpr.TypeExpr = typeExpr.withTypeParameter(
  typeExpr.globalType("ReadonlyArray"),
  [typeExpr.typeNumber]
);

const mathObject = expr.globalVariable("Math");

/* ========================================
                  UInt32
   ========================================
*/

const uInt32Name = ["decodeUInt32"];
export const uInt32Var = expr.localVariable(uInt32Name);

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
export const uInt32Code = expr.functionWithReturnValueVariableDefinition(
  uInt32Name,
  [{ name: ["num"], typeExpr: typeExpr.typeNumber }],
  readonlyArrayNumber,
  [
    expr.set(
      expr.localVariable(["num"]),
      null,
      expr.callMethod(mathObject, "floor", [
        expr.callMethod(mathObject, "max", [
          expr.numberLiteral(0),
          expr.callMethod(mathObject, "min", [
            expr.localVariable(["num"]),
            expr.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    expr.variableDefinition(
      ["numberArray"],
      readonlyArrayNumber,
      expr.arrayLiteral([])
    ),
    expr.whileTrue([
      expr.variableDefinition(
        ["b"],
        typeExpr.typeNumber,
        expr.bitwiseAnd(
          expr.localVariable(["num"]),
          expr.numberLiteral(0b1111111)
        )
      ),
      expr.set(
        expr.localVariable(["num"]),
        null,
        expr.unsignedRightShift(
          expr.localVariable(["num"]),
          expr.numberLiteral(7)
        )
      ),
      expr.ifStatement(
        expr.equal(expr.localVariable(["num"]), expr.numberLiteral(0)),
        [
          expr.evaluateExpr(
            expr.callMethod(expr.localVariable(["numberArray"]), "push", [
              expr.localVariable(["b"])
            ])
          ),
          expr.returnStatement(expr.localVariable(["numberArray"]))
        ]
      ),
      expr.evaluateExpr(
        expr.callMethod(expr.localVariable(["numberArray"]), "push", [
          expr.bitwiseOr(
            expr.localVariable(["b"]),
            expr.numberLiteral(0b10000000)
          )
        ])
      )
    ])
  ]
);
