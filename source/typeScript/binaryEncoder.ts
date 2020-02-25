import * as generator from "js-ts-code-generator";
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

export const uInt32Name = "decodeUInt32";

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
export const uInt32Code: [string, generator.ExportFunction] = [
  uInt32Name,
  {
    document:
      "numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード",
    parameterList: [
      { name: "num", typeExpr: typeExpr.typeNumber, document: "" }
    ],
    returnType: readonlyArrayNumber,
    statementList: [
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
  }
];

/* ========================================
                  String
   ========================================
*/

const stringName = "encodeString";

/**
 * stringからバイナリに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
export const stringCode = (
  isBrowser: boolean
): [string, generator.ExportFunction] => [
  stringName,
  {
    document:
      "stringからバイナリに変換するコード. このコードは" +
      (isBrowser
        ? "ブラウザ用なのでグローバルのTextDecoderを使う"
        : "Node.js用なのでutilのTextDecoderを使う"),
    parameterList: [
      { name: "text", typeExpr: typeExpr.typeString, document: "" }
    ],
    returnType: readonlyArrayNumber,
    statementList: [
      expr.returnStatement(
        expr.callMethod(expr.globalVariable("Array"), "from", [
          expr.callMethod(
            expr.newExpr(
              isBrowser
                ? expr.globalVariable("TextEncoder")
                : expr.importedVariable("util", "TextEncoder"),
              []
            ),
            "encode",
            [expr.localVariable(["text"])]
          )
        ])
      )
    ]
  }
];
