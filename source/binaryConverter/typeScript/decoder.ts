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
export const resultAndNextIndexReturnStatement = (
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
  isBrowse: boolean
): ReadonlyArray<[string, generator.ExportFunction]> => {
  const name = decodeName(type_);
  switch (type_._) {
    case type.Type_.UInt32:
      return [[name, uInt32Code]];
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
          resultAndNextIndexReturnStatement(
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

export const decodeVarEval = (type_: type.Type, data: expr.Expr): expr.Expr =>
  expr.call(expr.globalVariable(decodeName(type_)), [data]);
