import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as type from "../../type";
import * as typeScript from "../../typeScript";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>,
  isBrowser: boolean
): ReadonlyMap<string, generator.ExportFunction> => {
  const needDecodeTypeList = type.customTypeDictionaryCollectType(
    customTypeDictionary
  );
  let typeDecoderList: ReadonlyArray<[string, generator.ExportFunction]> = [];
  for (const uniqueNeedEncodeType of needDecodeTypeList) {
    typeDecoderList = typeDecoderList.concat(
      typeToDecodeCode(uniqueNeedEncodeType, isBrowser)
    );
  }

  return new Map(
    [...customTypeDictionary]
      .map(([name, customType]) => customCode(name, customType))
      .concat(typeDecoderList)
  );
};

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
export const returnStatement = (
  resultExpr: expr.Expr,
  nextIndexExpr: expr.Expr
): expr.Statement =>
  expr.returnStatement(
    expr.objectLiteral(
      new Map([
        ["result", resultExpr],
        ["nextIndex", nextIndexExpr]
      ])
    )
  );

const parameterList: ReadonlyArray<{
  name: string;
  typeExpr: typeExpr.TypeExpr;
  document: string;
}> = [
  {
    name: "index",
    typeExpr: typeExpr.typeNumber,
    document: "バイナリを読み込み開始位置"
  },
  {
    name: "binary",
    typeExpr: typeExpr.globalType("Uint8Array"),
    document: "バイナリ"
  }
];

/**
 * ```ts
 * { result: T, nextIndex: number }
 * ```
 * を表現するコード
 */
export const returnType = (resultType: typeExpr.TypeExpr): typeExpr.TypeExpr =>
  typeExpr.object(
    new Map([
      ["result", { typeExpr: resultType, document: "" }],
      ["nextIndex", { typeExpr: typeExpr.typeNumber, document: "" }]
    ])
  );

/* ========================================
                  Type
   ========================================
*/

const typeToDecodeCode = (
  type_: type.Type,
  isBrowser: boolean
): ReadonlyArray<[string, generator.ExportFunction]> => {
  const name = decodeName(type_);
  switch (type_._) {
    case type.Type_.UInt32:
      return [[name, uInt32Code]];
    case type.Type_.String:
      return [[name, stringCode(isBrowser)]];
    case type.Type_.Id:
      return [];
  }
  return [];
};

/* ========================================
                  UInt32
   ========================================
*/

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 */
export const uInt32Code: generator.ExportFunction = {
  document:
    "UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード",
  parameterList,
  returnType: returnType(typeExpr.typeNumber),
  statementList: [
    expr.letVariableDefinition(
      ["result"],
      typeExpr.typeNumber,
      expr.numberLiteral(0)
    ),
    expr.forStatement(["i"], expr.numberLiteral(5), [
      expr.variableDefinition(
        ["b"],
        typeExpr.typeNumber,
        expr.getByExpr(
          expr.localVariable(["binary"]),
          expr.addition(
            expr.localVariable(["index"]),
            expr.localVariable(["i"])
          )
        )
      ),
      expr.set(
        expr.localVariable(["result"]),
        "|",
        expr.leftShift(
          expr.bitwiseAnd(expr.localVariable(["b"]), expr.numberLiteral(0x7f)),
          expr.multiplication(expr.numberLiteral(7), expr.localVariable(["i"]))
        )
      ),
      expr.ifStatement(
        expr.logicalAnd(
          expr.logicalAnd(
            expr.equal(
              expr.bitwiseAnd(
                expr.localVariable(["b"]),
                expr.numberLiteral(0x08)
              ),
              expr.numberLiteral(0)
            ),
            expr.lessThanOrEqual(
              expr.numberLiteral(0),
              expr.localVariable(["result"])
            )
          ),
          expr.lessThan(
            expr.localVariable(["result"]),
            expr.numberLiteral(2 ** 32 - 1)
          )
        ),
        [
          returnStatement(
            expr.localVariable(["result"]),
            expr.addition(
              expr.addition(
                expr.localVariable(["index"]),
                expr.localVariable(["i"])
              ),
              expr.numberLiteral(1)
            )
          )
        ]
      )
    ]),
    expr.throwError(expr.stringLiteral("larger than 32-bits"))
  ]
};
/* ========================================
                  String
   ========================================
*/
/**
 * バイナリからstringに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
export const stringCode = (isBrowser: boolean): generator.ExportFunction => ({
  document:
    "バイナリからstringに変換する." +
    (isBrowser
      ? "このコードはブラウザ用でグローバルのTextDecoderを使う."
      : "このコードはNode.js用でutilのTextDecoderを使う"),
  parameterList: parameterList,
  returnType: returnType(typeExpr.typeString),
  statementList: [
    expr.variableDefinition(
      ["length"],
      returnType(typeExpr.typeNumber),
      decodeVarEval(
        type.typeUInt32,
        expr.localVariable(["index"]),
        expr.localVariable(["binary"])
      )
    ),
    returnStatement(
      expr.callMethod(
        expr.newExpr(
          isBrowser
            ? expr.globalVariable("TextDecoder")
            : expr.importedVariable("util", "TextDecoder"),
          []
        ),
        "decode",
        [
          expr.callMethod(expr.localVariable(["binary"]), "slice", [
            expr.addition(
              expr.localVariable(["index"]),
              expr.get(expr.localVariable(["length"]), "nextIndex")
            ),
            expr.addition(
              expr.addition(
                expr.localVariable(["index"]),
                expr.get(expr.localVariable(["length"]), "nextIndex")
              ),
              expr.get(expr.localVariable(["length"]), "result")
            )
          ])
        ]
      ),
      expr.addition(
        expr.addition(
          expr.localVariable(["index"]),
          expr.get(expr.localVariable(["length"]), "nextIndex")
        ),
        expr.get(expr.localVariable(["length"]), "result")
      )
    )
  ]
});

/* ========================================
            HexString (Id / Hash)
   ========================================
*/

const hexStringCode = (
  byteSize: number,
  customTypeName: string
): generator.ExportFunction => ({
  document: "",
  parameterList,
  returnType: returnType(
    typeScript.typeToGeneratorType(type.typeCustom(customTypeName))
  ),
  statementList: [
    returnStatement(
      expr.callMethod(expr.globalVariable("Array"), "from", [
        expr.callMethod(
          expr.callMethod(
            expr.callMethod(expr.localVariable(["binary"]), "slice", [
              expr.localVariable(["index"]),
              expr.addition(
                expr.localVariable(["index"]),
                expr.numberLiteral(byteSize)
              )
            ]),
            "map",
            [
              expr.lambdaWithReturn(
                [
                  {
                    name: ["n"],
                    typeExpr: typeExpr.typeNumber
                  }
                ],
                typeExpr.typeString,
                [
                  expr.evaluateExpr(
                    expr.callMethod(
                      expr.callMethod(expr.localVariable(["n"]), "toString", [
                        expr.numberLiteral(16)
                      ]),
                      "padStart",
                      [expr.numberLiteral(2), expr.stringLiteral("0")]
                    )
                  )
                ]
              )
            ]
          ),
          "join",
          [expr.stringLiteral("")]
        )
      ]),
      expr.addition(expr.localVariable(["index"]), expr.numberLiteral(byteSize))
    )
  ]
});

/* ========================================
                  Custom
   ========================================
*/
const customCode = (
  customTypeName: string,
  customType: type.CustomType
): [string, generator.ExportFunction] => {
  return [
    decodeName(type.typeCustom(customTypeName)),
    {
      document: "",
      parameterList: parameterList,
      returnType: returnType(
        typeScript.typeToGeneratorType(type.typeCustom(customTypeName))
      ),
      statementList: []
    }
  ];
};

const decodeName = (type_: type.Type): string => {
  return "decode" + type.toTypeName(type_);
};

export const decodeVarEval = (
  type_: type.Type,
  index: expr.Expr,
  binary: expr.Expr
): expr.Expr =>
  expr.call(expr.globalVariable(decodeName(type_)), [index, binary]);
