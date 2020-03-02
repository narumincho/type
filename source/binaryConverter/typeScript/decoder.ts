import * as generator from "js-ts-code-generator";
import { data } from "js-ts-code-generator";
import * as type from "../../type";
import * as typeScript from "../../typeScript";

export const generateCode = (
  customTypeList: ReadonlyArray<type.CustomType>,
  isBrowser: boolean
): ReadonlyArray<data.Definition> => {
  return [
    data.definitionFunction(uInt32Code),
    data.definitionFunction(stringCode(isBrowser)),
    data.definitionFunction(boolCode),
    data.definitionFunction(listCode()),
    data.definitionFunction(hexStringCode(16, idName)),
    data.definitionFunction(hexStringCode(32, hashOrAccessTokenName))
  ];
};
const idName = generator.identifer.fromString("decodeId");
const hashOrAccessTokenName = generator.identifer.fromString(
  "decodeHashOrAccessToken"
);

export const decodeVarEval = (
  type_: type.Type,
  index: data.Expr,
  binary: data.Expr
): data.Expr => {
  switch (type_._) {
    case "UInt32":
      return data.call(data.variable(uInt32Name), [index, binary]);
  }
  return data.stringLiteral("まだサポートしていない");
};

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
const returnStatement = (
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

/**
 * ( index: number, binary: Uint8Array )
 */
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
                  UInt32
   ========================================
*/

const uInt32Name = generator.identifer.fromString("decodeUInt32");
/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 */
const uInt32Code: data.Function = {
  name: uInt32Name,
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
const stringName = generator.identifer.fromString("decodeString");

/**
 * バイナリからstringに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
export const stringCode = (isBrowser: boolean): data.Function => ({
  name: stringName,
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
                  Bool
   ========================================
*/
const boolName = generator.identifer.fromString("decodeBool");

const boolCode: data.Function = {
  name: boolName,
  document: "",
  parameterList,
  returnType: returnType(data.typeBoolean),
  typeParameterList: [],
  statementList: [
    returnStatement(
      data.notEqual(
        data.getByExpr(parameterBinary, parameterIndex),
        data.numberLiteral(0)
      ),
      data.addition(parameterIndex, data.numberLiteral(1))
    )
  ]
};

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
                  List
   ========================================
*/
const listName = generator.identifer.fromString("decodeList");

const listCode = (): data.Function => {
  const elementTypeName = generator.identifer.fromString("T");
  const elementTypeVar = data.typeScopeInFile(elementTypeName);
  const decodeFunctionName = generator.identifer.fromString("decodeFunction");
  const decodeFunctionVar = data.variable(decodeFunctionName);
  const resultName = generator.identifer.fromString("result");
  const resultVar = data.variable(resultName);
  const resultAndNextIndexName = generator.identifer.fromString(
    "resultAndNextIndex"
  );
  const resultAndNextIndexVar = data.variable(resultAndNextIndexName);

  return {
    name: listName,
    document: "",
    parameterList: [
      {
        name: decodeFunctionName,
        document: "",
        type_: data.typeFunction(
          [data.typeNumber, data.uint8ArrayType],
          returnType(elementTypeVar)
        )
      }
    ],
    returnType: data.typeFunction(
      [data.typeNumber, data.uint8ArrayType],
      returnType(data.readonlyArrayType(elementTypeVar))
    ),
    typeParameterList: [elementTypeName],
    statementList: [
      data.statementReturn(
        data.lambda(parameterList, data.readonlyArrayType(elementTypeVar), [
          data.statementVariableDefinition(
            generator.identifer.fromString("length"),
            data.typeNumber,
            data.getByExpr(parameterBinary, parameterIndex)
          ),
          data.statementVariableDefinition(
            resultName,
            data.arrayType(elementTypeVar),
            data.arrayLiteral([])
          ),
          data.statementFor(
            generator.identifer.fromString("i"),
            data.variable(generator.identifer.fromString("length")),
            [
              data.statementVariableDefinition(
                resultAndNextIndexName,
                returnType(elementTypeVar),
                data.call(decodeFunctionVar, [parameterIndex, parameterBinary])
              ),
              data.statementEvaluateExpr(
                data.callMethod(resultVar, "push", [
                  data.get(resultAndNextIndexVar, "result")
                ])
              ),
              data.statementSet(
                parameterIndex,
                null,
                data.get(resultAndNextIndexVar, "nextIndex")
              )
            ]
          ),
          returnStatement(resultVar, parameterIndex)
        ])
      )
    ]
  };
};

/* ========================================
                  Custom
   ========================================
*/

const customName = (customTypeName: string): generator.identifer.Identifer =>
  generator.identifer.fromString("decodeCustom" + customTypeName);

const customCode = (
  customTypeName: string,
  customType: type.CustomType
): data.Function => {
  return {
    name: customName(customTypeName),
    document: "",
    parameterList: parameterList,
    typeParameterList: [],
    returnType: returnType(
      typeScript.typeToGeneratorType(type.typeCustom(customTypeName))
    ),
    statementList: []
  };
};
