import * as generator from "js-ts-code-generator";
import { data } from "js-ts-code-generator";
import * as type from "../../type";
import * as typeScript from "../../typeScript";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>,
  isBrowser: boolean
): ReadonlyArray<data.Definition> => {
  const needDecodeTypeList = type.customTypeDictionaryCollectType(
    customTypeDictionary
  );
  let typeDecoderList: ReadonlyArray<[string, data.Function]> = [];
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

const decodeName = (type_: type.Type): generator.identifer.Identifer => {
  return generator.identifer.fromString("decode" + type.toTypeName(type_));
};

export const decodeVarEval = (
  type_: type.Type,
  index: data.Expr,
  binary: data.Expr
): data.Expr => data.call(data.variable(decodeName(type_)), [index, binary]);

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
export const returnStatement = (
  resultExpr: data.Expr,
  nextIndexExpr: data.Expr
): data.Statement =>
  data.statementReturn(
    data.objectLiteral(
      new Map([
        ["result", resultExpr],
        ["nextIndex", nextIndexExpr]
      ])
    )
  );

const indexIdentifer = generator.identifer.fromString("index");
const binaryIdentifer = generator.identifer.fromString("binary");

const parameterList: ReadonlyArray<data.ParameterWithDocument> = [
  {
    name: indexIdentifer,
    type_: data.typeNumber,
    document: "バイナリを読み込み開始位置"
  },
  {
    name: binaryIdentifer,
    type_: data.uint8ArrayType,
    document: "バイナリ"
  }
];

const parameterIndex = data.variable(indexIdentifer);
const parameterBinary = data.variable(binaryIdentifer);

/**
 * ```ts
 * { result: T, nextIndex: number }
 * ```
 * を表現するコード
 */
export const returnType = (resultType: data.Type): data.Type =>
  data.typeObject(
    new Map([
      ["result", { type_: resultType, document: "" }],
      ["nextIndex", { type_: data.typeNumber, document: "" }]
    ])
  );

/* ========================================
                  Type
   ========================================
*/

const typeToDecodeCode = (
  type_: type.Type,
  isBrowser: boolean
): ReadonlyArray<[string, data.Function]> => {
  const name = decodeName(type_);
  switch (type_._) {
    case "UInt32":
      return [[name, uInt32Code]];
    case "String":
      return [[name, stringCode(isBrowser)]];
    case "Id":
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
export const uInt32Code: data.Function = {
  name: decodeName(type.typeUInt32),
  document:
    "UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード",
  parameterList,
  typeParameterList: [],
  returnType: returnType(data.typeNumber),
  statementList: [
    data.statementLetVariableDefinition(
      generator.identifer.fromString("result"),
      data.typeNumber,
      data.numberLiteral(0)
    ),
    data.statementFor(
      generator.identifer.fromString("i"),
      data.numberLiteral(5),
      [
        data.statementVariableDefinition(
          generator.identifer.fromString("b"),
          data.typeNumber,
          data.getByExpr(
            parameterBinary,
            data.addition(
              parameterIndex,
              data.variable(generator.identifer.fromString("i"))
            )
          )
        ),
        data.statementSet(
          data.variable(generator.identifer.fromString("result")),
          "|",
          data.leftShift(
            data.bitwiseAnd(
              data.variable(generator.identifer.fromString("b")),
              data.numberLiteral(0x7f)
            ),
            data.multiplication(
              data.numberLiteral(7),
              data.variable(generator.identifer.fromString("i"))
            )
          )
        ),
        data.statementIf(
          data.logicalAnd(
            data.logicalAnd(
              data.equal(
                data.bitwiseAnd(
                  data.variable(generator.identifer.fromString("b")),
                  data.numberLiteral(0x08)
                ),
                data.numberLiteral(0)
              ),
              data.lessThanOrEqual(
                data.numberLiteral(0),
                data.variable(generator.identifer.fromString("result"))
              )
            ),
            data.lessThan(
              data.variable(generator.identifer.fromString("result")),
              data.numberLiteral(2 ** 32 - 1)
            )
          ),
          [
            returnStatement(
              data.variable(generator.identifer.fromString("result")),
              data.addition(
                data.addition(
                  parameterIndex,
                  data.variable(generator.identifer.fromString("i"))
                ),
                data.numberLiteral(1)
              )
            )
          ]
        )
      ]
    ),
    data.statementThrowError(data.stringLiteral("larger than 32-bits"))
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
export const stringCode = (isBrowser: boolean): data.Function => ({
  name: decodeName(type.typeString),
  document:
    "バイナリからstringに変換する." +
    (isBrowser
      ? "このコードはブラウザ用でグローバルのTextDecoderを使う."
      : "このコードはNode.js用でutilのTextDecoderを使う"),
  parameterList: parameterList,
  typeParameterList: [],
  returnType: returnType(data.typeString),
  statementList: [
    data.statementVariableDefinition(
      generator.identifer.fromString("length"),
      returnType(data.typeNumber),
      decodeVarEval(type.typeUInt32, parameterIndex, parameterBinary)
    ),
    returnStatement(
      data.callMethod(
        data.newExpr(
          isBrowser
            ? data.globalObjects(generator.identifer.fromString("TextDecoder"))
            : data.importedVariable(
                "util",
                generator.identifer.fromString("TextDecoder")
              ),
          []
        ),
        "decode",
        [
          data.callMethod(parameterBinary, "slice", [
            data.addition(
              parameterIndex,
              data.get(
                data.variable(generator.identifer.fromString("length")),
                "nextIndex"
              )
            ),
            data.addition(
              data.addition(
                parameterIndex,
                data.get(
                  data.variable(generator.identifer.fromString("length")),
                  "nextIndex"
                )
              ),
              data.get(
                data.variable(generator.identifer.fromString("length")),
                "result"
              )
            )
          ])
        ]
      ),
      data.addition(
        data.addition(
          parameterIndex,
          data.get(
            data.variable(generator.identifer.fromString("length")),
            "nextIndex"
          )
        ),
        data.get(
          data.variable(generator.identifer.fromString("length")),
          "result"
        )
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
  functionName: generator.identifer.Identifer
): data.Function => ({
  name: functionName,
  document: "",
  parameterList,
  typeParameterList: [],
  returnType: returnType(data.typeString),
  statementList: [
    returnStatement(
      data.callMethod(
        data.globalObjects(generator.identifer.fromString("Array")),
        "from",
        [
          data.callMethod(
            data.callMethod(
              data.callMethod(parameterBinary, "slice", [
                parameterIndex,
                data.addition(parameterIndex, data.numberLiteral(byteSize))
              ]),
              "map",
              [
                data.lambda(
                  [
                    {
                      name: generator.identifer.fromString("n"),
                      type_: data.typeNumber
                    }
                  ],
                  data.typeString,
                  [
                    data.statementEvaluateExpr(
                      data.callMethod(
                        data.callMethod(
                          data.variable(generator.identifer.fromString("n")),
                          "toString",
                          [data.numberLiteral(16)]
                        ),
                        "padStart",
                        [data.numberLiteral(2), data.stringLiteral("0")]
                      )
                    )
                  ]
                )
              ]
            ),
            "join",
            [data.stringLiteral("")]
          )
        ]
      ),
      data.addition(parameterIndex, data.numberLiteral(byteSize))
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
): data.Function => {
  return {
    name: decodeName(type.typeCustom(customTypeName)),
    document: "",
    parameterList: parameterList,
    typeParameterList: [],
    returnType: returnType(
      typeScript.typeToGeneratorType(type.typeCustom(customTypeName))
    ),
    statementList: []
  };
};
