import { data, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as typeScript from "./type";
import * as typeDef from "./typeDefinition";
import * as tag from "./tag";

export const generateCode = (
  customTypeList: ReadonlyArray<type.CustomType>,
  isBrowser: boolean
): ReadonlyArray<data.Definition> => {
  return [
    data.definitionFunction(uInt32Code),
    data.definitionFunction(stringCode(isBrowser)),
    data.definitionFunction(boolCode),
    data.definitionFunction(dateTimeCode),
    data.definitionFunction(listCode()),
    data.definitionFunction(maybeCode()),
    data.definitionFunction(resultCode()),
    data.definitionFunction(hexStringCode(16, idName)),
    data.definitionFunction(hexStringCode(32, hashOrAccessTokenName))
  ];
};
const idName = identifer.fromString("decodeId");
const hashOrAccessTokenName = identifer.fromString("decodeHashOrAccessToken");

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

const resultProperty = "result";
const nextIndexProperty = "nextIndex";

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
        [resultProperty, resultExpr],
        [nextIndexProperty, nextIndexExpr]
      ])
    )
  );

const indexIdentifer = identifer.fromString("index");
const binaryIdentifer = identifer.fromString("binary");

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
      [resultProperty, { type_: resultType, document: "" }],
      [nextIndexProperty, { type_: data.typeNumber, document: "" }]
    ])
  );

const getResult = (resultAndNextIndexExpr: data.Expr): data.Expr =>
  data.get(resultAndNextIndexExpr, resultProperty);

const getNextIndex = (resultAndNextIndexExpr: data.Expr): data.Expr =>
  data.get(resultAndNextIndexExpr, nextIndexProperty);

/* ========================================
                  UInt32
   ========================================
*/

const uInt32Name = identifer.fromString("decodeUInt32");
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
      identifer.fromString("result"),
      data.typeNumber,
      data.numberLiteral(0)
    ),
    data.statementFor(identifer.fromString("i"), data.numberLiteral(5), [
      data.statementVariableDefinition(
        identifer.fromString("b"),
        data.typeNumber,
        data.getByExpr(
          parameterBinary,
          data.addition(
            parameterIndex,
            data.variable(identifer.fromString("i"))
          )
        )
      ),
      data.statementSet(
        data.variable(identifer.fromString("result")),
        "|",
        data.leftShift(
          data.bitwiseAnd(
            data.variable(identifer.fromString("b")),
            data.numberLiteral(0x7f)
          ),
          data.multiplication(
            data.numberLiteral(7),
            data.variable(identifer.fromString("i"))
          )
        )
      ),
      data.statementIf(
        data.logicalAnd(
          data.logicalAnd(
            data.equal(
              data.bitwiseAnd(
                data.variable(identifer.fromString("b")),
                data.numberLiteral(0x08)
              ),
              data.numberLiteral(0)
            ),
            data.lessThanOrEqual(
              data.numberLiteral(0),
              data.variable(identifer.fromString("result"))
            )
          ),
          data.lessThan(
            data.variable(identifer.fromString("result")),
            data.numberLiteral(2 ** 32 - 1)
          )
        ),
        [
          returnStatement(
            data.variable(identifer.fromString("result")),
            data.addition(
              data.addition(
                parameterIndex,
                data.variable(identifer.fromString("i"))
              ),
              data.numberLiteral(1)
            )
          )
        ]
      )
    ]),
    data.statementThrowError(data.stringLiteral("larger than 32-bits"))
  ]
};
/* ========================================
                  String
   ========================================
*/
const stringName = identifer.fromString("decodeString");

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
      identifer.fromString("length"),
      returnType(data.typeNumber),
      decodeVarEval(type.typeUInt32, parameterIndex, parameterBinary)
    ),
    returnStatement(
      data.callMethod(
        data.newExpr(
          isBrowser
            ? data.globalObjects(identifer.fromString("TextDecoder"))
            : data.importedVariable(
                "util",
                identifer.fromString("TextDecoder")
              ),
          []
        ),
        "decode",
        [
          data.callMethod(parameterBinary, "slice", [
            data.addition(
              parameterIndex,
              getNextIndex(data.variable(identifer.fromString("length")))
            ),
            data.addition(
              data.addition(
                parameterIndex,
                getNextIndex(data.variable(identifer.fromString("length")))
              ),
              getResult(data.variable(identifer.fromString("length")))
            )
          ])
        ]
      ),
      data.addition(
        data.addition(
          parameterIndex,
          getNextIndex(data.variable(identifer.fromString("length")))
        ),
        getResult(data.variable(identifer.fromString("length")))
      )
    )
  ]
});
/* ========================================
                  Bool
   ========================================
*/
const boolName = identifer.fromString("decodeBool");

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
                DateTime
   ========================================
*/
const dateTimeName = identifer.fromString("decodeDateTime");

const dateTimeCode: data.Function = {
  name: dateTimeName,
  document: "",
  parameterList,
  returnType: returnType(data.dateType),
  typeParameterList: [],
  statementList: [
    data.statementVariableDefinition(
      identifer.fromString("result"),
      returnType(data.typeNumber),
      decodeVarEval(type.typeUInt32, parameterIndex, parameterBinary)
    ),
    returnStatement(
      data.newExpr(data.globalObjects(identifer.fromString("Date")), [
        data.multiplication(
          getResult(data.variable(identifer.fromString("result"))),
          data.numberLiteral(1000)
        )
      ]),
      getNextIndex(data.variable(identifer.fromString("result")))
    )
  ]
};

/* ========================================
            HexString (Id / Hash)
   ========================================
*/
const hexStringCode = (
  byteSize: number,
  functionName: identifer.Identifer
): data.Function => ({
  name: functionName,
  document: "",
  parameterList,
  typeParameterList: [],
  returnType: returnType(data.typeString),
  statementList: [
    returnStatement(
      data.callMethod(
        data.callMethod(
          data.callMethod(
            data.globalObjects(identifer.fromString("Array")),
            "from",
            [
              data.callMethod(parameterBinary, "slice", [
                parameterIndex,
                data.addition(parameterIndex, data.numberLiteral(byteSize))
              ])
            ]
          ),
          "map",
          [
            data.lambda(
              [
                {
                  name: identifer.fromString("n"),
                  type_: data.typeNumber
                }
              ],
              data.typeString,
              [
                data.statementReturn(
                  data.callMethod(
                    data.callMethod(
                      data.variable(identifer.fromString("n")),
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
      ),

      data.addition(parameterIndex, data.numberLiteral(byteSize))
    )
  ]
});

/* ========================================
                  List
   ========================================
*/
const listName = identifer.fromString("decodeList");

const listCode = (): data.Function => {
  const elementTypeName = identifer.fromString("T");
  const elementTypeVar = data.typeScopeInFile(elementTypeName);
  const decodeFunctionName = identifer.fromString("decodeFunction");
  const decodeFunctionVar = data.variable(decodeFunctionName);
  const resultName = identifer.fromString("result");
  const resultVar = data.variable(resultName);
  const resultAndNextIndexName = identifer.fromString("resultAndNextIndex");
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
        data.lambda(
          parameterList,
          returnType(data.readonlyArrayType(elementTypeVar)),
          [
            data.statementVariableDefinition(
              identifer.fromString("length"),
              data.typeNumber,
              data.getByExpr(parameterBinary, parameterIndex)
            ),
            data.statementVariableDefinition(
              resultName,
              data.arrayType(elementTypeVar),
              data.arrayLiteral([])
            ),
            data.statementFor(
              identifer.fromString("i"),
              data.variable(identifer.fromString("length")),
              [
                data.statementVariableDefinition(
                  resultAndNextIndexName,
                  returnType(elementTypeVar),
                  data.call(decodeFunctionVar, [
                    parameterIndex,
                    parameterBinary
                  ])
                ),
                data.statementEvaluateExpr(
                  data.callMethod(resultVar, "push", [
                    getResult(resultAndNextIndexVar)
                  ])
                ),
                data.statementSet(
                  parameterIndex,
                  null,
                  getNextIndex(resultAndNextIndexVar)
                )
              ]
            ),
            returnStatement(resultVar, parameterIndex)
          ]
        )
      )
    ]
  };
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeName = identifer.fromString("decodeMaybe");

const maybeCode = (): data.Function => {
  const decodeFunctionName = identifer.fromString("decodeFunction");
  const elementTypeName = identifer.fromString("T");
  const elementTypeVar = data.typeScopeInFile(elementTypeName);
  const patternIndexAndNextIndexName = identifer.fromString(
    "patternIndexAndNextIndex"
  );
  const patternIndexAndNextIndexVar = data.variable(
    patternIndexAndNextIndexName
  );

  const body: ReadonlyArray<data.Statement> = [
    data.statementVariableDefinition(
      patternIndexAndNextIndexName,
      returnType(data.typeNumber),
      decodeVarEval(type.typeUInt32, parameterIndex, parameterBinary)
    ),
    data.statementIf(
      data.equal(getResult(patternIndexAndNextIndexVar), data.numberLiteral(0)),
      [
        data.statementVariableDefinition(
          identifer.fromString("valueAndNextIndex"),
          returnType(elementTypeVar),
          data.call(data.variable(decodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.maybeJustVarEval(
            getResult(data.variable(identifer.fromString("valueAndNextIndex")))
          ),
          getNextIndex(data.variable(identifer.fromString("valueAndNextIndex")))
        )
      ]
    ),
    data.statementIf(
      data.equal(getResult(patternIndexAndNextIndexVar), data.numberLiteral(1)),
      [
        returnStatement(
          tag.maybeNothingVarEval,
          getNextIndex(patternIndexAndNextIndexVar)
        )
      ]
    ),
    data.statementThrowError(
      data.stringLiteral(
        "存在しないMaybeのパターンを受け取った. 型情報を更新してください"
      )
    )
  ];

  return {
    name: maybeName,
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
      returnType(typeDef.maybeVar(elementTypeVar))
    ),
    typeParameterList: [elementTypeName],
    statementList: [
      data.statementReturn(
        data.lambda(
          parameterList,
          returnType(typeDef.maybeVar(elementTypeVar)),
          body
        )
      )
    ]
  };
};

/* ========================================
                  Result
   ========================================
*/

const resultName = identifer.fromString("decodeResult");

const resultCode = (): data.Function => {
  const okTypeName = identifer.fromString("ok");
  const okTypeVar = data.typeScopeInFile(okTypeName);
  const errorTypeName = identifer.fromString("error");
  const errorTypeVar = data.typeScopeInFile(errorTypeName);
  const okDecodeFunctionName = identifer.fromString("okDecodeFunction");
  const errorDecodeFunctionName = identifer.fromString("errorDecodeFunction");
  const patternIndexAndNextIndexName = identifer.fromString(
    "patternIndexAndNextIndex"
  );
  const patternIndexAndNextIndexVar = data.variable(
    patternIndexAndNextIndexName
  );

  const body: ReadonlyArray<data.Statement> = [
    data.statementVariableDefinition(
      patternIndexAndNextIndexName,
      returnType(data.typeNumber),
      decodeVarEval(type.typeUInt32, parameterIndex, parameterBinary)
    ),
    data.statementIf(
      data.equal(getResult(patternIndexAndNextIndexVar), data.numberLiteral(0)),
      [
        data.statementVariableDefinition(
          identifer.fromString("okAndNextIndex"),
          returnType(okTypeVar),
          data.call(data.variable(okDecodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.resultOkVarEval(
            getResult(data.variable(identifer.fromString("okAndNextIndex")))
          ),
          getNextIndex(data.variable(identifer.fromString("okAndNextIndex")))
        )
      ]
    ),
    data.statementIf(
      data.equal(getResult(patternIndexAndNextIndexVar), data.numberLiteral(1)),
      [
        data.statementVariableDefinition(
          identifer.fromString("errorAndNextIndex"),
          returnType(errorTypeVar),
          data.call(data.variable(errorDecodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.resultErrorVarEval(
            getResult(data.variable(identifer.fromString("errorAndNextIndex")))
          ),
          getNextIndex(data.variable(identifer.fromString("errorAndNextIndex")))
        )
      ]
    ),
    data.statementThrowError(
      data.stringLiteral(
        "存在しないResultのパターンを受け取った. 型情報を更新してください"
      )
    )
  ];

  return {
    name: resultName,
    document: "",
    parameterList: [
      {
        name: okDecodeFunctionName,
        document: "",
        type_: data.typeFunction(
          [data.typeNumber, data.uint8ArrayType],
          returnType(okTypeVar)
        )
      },
      {
        name: errorDecodeFunctionName,
        document: "",
        type_: data.typeFunction(
          [data.typeNumber, data.uint8ArrayType],
          returnType(errorTypeVar)
        )
      }
    ],
    returnType: data.typeFunction(
      [data.typeNumber, data.uint8ArrayType],
      returnType(typeDef.resultVar(okTypeVar, errorTypeVar))
    ),
    typeParameterList: [okTypeName, errorTypeName],
    statementList: [
      data.statementReturn(
        data.lambda(
          parameterList,
          returnType(typeDef.resultVar(okTypeVar, errorTypeVar)),
          body
        )
      )
    ]
  };
};

/* ========================================
                  Custom
   ========================================
*/

const customName = (customTypeName: string): identifer.Identifer =>
  identifer.fromString("decodeCustom" + customTypeName);

const customCode = (customType: type.CustomType): data.Function => {
  return {
    name: customName(customType.name),
    document: "",
    parameterList: parameterList,
    typeParameterList: [],
    returnType: returnType(
      typeScript.typeToGeneratorType(type.typeCustom(customType.name))
    ),
    statementList: []
  };
};
