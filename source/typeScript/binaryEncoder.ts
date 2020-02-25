import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as c from "../case";

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

/* ========================================
                  Id
   ========================================
*/

const idName = (customTypeName: string): string =>
  "encode" + c.firstUpperCase(customTypeName) + "Id";

export const idCode = (
  customTypeName: string
): [string, generator.ExportFunction] =>
  encodeHexString(16, idName(customTypeName));

/* ========================================
                  Hash
   ========================================
*/

const hashName = (customTypeName: string): string =>
  "encode" + c.firstUpperCase(customTypeName) + "Hash";

export const hashCode = (
  customTypeName: string
): [string, generator.ExportFunction] =>
  encodeHexString(32, hashName(customTypeName));

/* ========================================
            HexString (Id / Hash)
   ========================================
*/

const encodeHexString = (
  byteSize: number,
  functionName: string
): [string, generator.ExportFunction] => [
  functionName,
  {
    document: "",
    parameterList: [
      { name: "id", typeExpr: typeExpr.typeString, document: "" }
    ],
    returnType: readonlyArrayNumber,
    statementList: [
      expr.variableDefinition(
        ["result"],
        typeExpr.withTypeParameter(typeExpr.globalType("Array"), [
          typeExpr.typeNumber
        ]),
        expr.arrayLiteral([])
      ),
      expr.forStatement(["i"], expr.numberLiteral(byteSize), [
        expr.set(
          expr.getByExpr(
            expr.localVariable(["result"]),
            expr.localVariable(["i"])
          ),
          null,
          expr.callMethod(expr.globalVariable("Number"), "parseInt", [
            expr.callMethod(expr.localVariable(["id"]), "slice", [
              expr.multiplication(
                expr.localVariable(["i"]),
                expr.numberLiteral(2)
              ),
              expr.addition(
                expr.multiplication(
                  expr.localVariable(["i"]),
                  expr.numberLiteral(2)
                ),
                expr.numberLiteral(2)
              )
            ]),
            expr.numberLiteral(16)
          ])
        )
      ])
    ]
  }
];
