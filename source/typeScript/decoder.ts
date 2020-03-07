import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as typeDef from "./typeDefinition";
import * as tag from "./tag";

export const generateCode = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<ts.Function> => {
  return [
    int32Code,
    stringCode,
    boolCode,
    listCode(),
    maybeCode(),
    resultCode(),
    hexStringCode(16, idName),
    hexStringCode(32, tokenName),
    ...customTypeList.map(customCode)
  ];
};
const idName = identifer.fromString("decodeId");
const tokenName = identifer.fromString("decodeHashOrAccessToken");

const resultProperty = "result";
const nextIndexProperty = "nextIndex";

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
const returnStatement = (
  resultExpr: ts.Expr,
  nextIndexExpr: ts.Expr
): ts.Statement =>
  ts.statementReturn(
    ts.objectLiteral(
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
const parameterList: ReadonlyArray<ts.ParameterWithDocument> = [
  {
    name: indexIdentifer,
    type_: ts.typeNumber,
    document: "バイナリを読み込み開始位置"
  },
  {
    name: binaryIdentifer,
    type_: ts.uint8ArrayType,
    document: "バイナリ"
  }
];

const parameterIndex = ts.variable(indexIdentifer);
const parameterBinary = ts.variable(binaryIdentifer);

/**
 * ```ts
 * { result: T, nextIndex: number }
 * ```
 * を表現するコード
 */
export const returnType = (resultType: ts.Type): ts.Type =>
  ts.typeObject(
    new Map([
      [resultProperty, { type_: resultType, document: "" }],
      [nextIndexProperty, { type_: ts.typeNumber, document: "" }]
    ])
  );

const getResult = (resultAndNextIndexExpr: ts.Expr): ts.Expr =>
  ts.get(resultAndNextIndexExpr, resultProperty);

const getNextIndex = (resultAndNextIndexExpr: ts.Expr): ts.Expr =>
  ts.get(resultAndNextIndexExpr, nextIndexProperty);

/* ========================================
                  Int32
   ========================================
*/

const int32Name = identifer.fromString("decodeInt");

const intVarEval = (indexExpr: ts.Expr, binaryExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(int32Name), [indexExpr, binaryExpr]);

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 */
const int32Code: ts.Function = {
  name: int32Name,
  document:
    "UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード",
  parameterList,
  typeParameterList: [],
  returnType: returnType(ts.typeNumber),
  statementList: [
    ts.statementLetVariableDefinition(
      identifer.fromString("result"),
      ts.typeNumber,
      ts.numberLiteral(0)
    ),
    ts.statementFor(identifer.fromString("i"), ts.numberLiteral(5), [
      ts.statementVariableDefinition(
        identifer.fromString("b"),
        ts.typeNumber,
        ts.getByExpr(
          parameterBinary,
          ts.addition(parameterIndex, ts.variable(identifer.fromString("i")))
        )
      ),
      ts.statementSet(
        ts.variable(identifer.fromString("result")),
        "|",
        ts.leftShift(
          ts.bitwiseAnd(
            ts.variable(identifer.fromString("b")),
            ts.numberLiteral(0x7f)
          ),
          ts.multiplication(
            ts.numberLiteral(7),
            ts.variable(identifer.fromString("i"))
          )
        )
      ),
      ts.statementIf(
        ts.logicalAnd(
          ts.logicalAnd(
            ts.equal(
              ts.bitwiseAnd(
                ts.variable(identifer.fromString("b")),
                ts.numberLiteral(0x08)
              ),
              ts.numberLiteral(0)
            ),
            ts.lessThanOrEqual(
              ts.numberLiteral(0),
              ts.variable(identifer.fromString("result"))
            )
          ),
          ts.lessThan(
            ts.variable(identifer.fromString("result")),
            ts.numberLiteral(2 ** 32 - 1)
          )
        ),
        [
          returnStatement(
            ts.variable(identifer.fromString("result")),
            ts.addition(
              ts.addition(
                parameterIndex,
                ts.variable(identifer.fromString("i"))
              ),
              ts.numberLiteral(1)
            )
          )
        ]
      )
    ]),
    ts.statementThrowError(ts.stringLiteral("larger than 32-bits"))
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
export const stringCode: ts.Function = {
  name: stringName,
  document: "バイナリからstringに変換する.",
  parameterList: parameterList,
  typeParameterList: [],
  returnType: returnType(ts.typeString),
  statementList: [
    ts.statementVariableDefinition(
      identifer.fromString("length"),
      returnType(ts.typeNumber),
      intVarEval(parameterIndex, parameterBinary)
    ),
    returnStatement(
      ts.callMethod(
        ts.newExpr(
          ts.conditionalOperator(
            ts.equal(
              ts.globalObjects(identifer.fromString("process")),
              ts.undefinedLiteral
            ),
            ts.globalObjects(identifer.fromString("TextDecoder")),
            ts.importedVariable("util", identifer.fromString("TextDecoder"))
          ),
          []
        ),
        "decode",
        [
          ts.callMethod(parameterBinary, "slice", [
            ts.addition(
              parameterIndex,
              getNextIndex(ts.variable(identifer.fromString("length")))
            ),
            ts.addition(
              ts.addition(
                parameterIndex,
                getNextIndex(ts.variable(identifer.fromString("length")))
              ),
              getResult(ts.variable(identifer.fromString("length")))
            )
          ])
        ]
      ),
      ts.addition(
        ts.addition(
          parameterIndex,
          getNextIndex(ts.variable(identifer.fromString("length")))
        ),
        getResult(ts.variable(identifer.fromString("length")))
      )
    )
  ]
};
/* ========================================
                  Bool
   ========================================
*/
const boolName = identifer.fromString("decodeBool");

const boolCode: ts.Function = {
  name: boolName,
  document: "",
  parameterList,
  returnType: returnType(ts.typeBoolean),
  typeParameterList: [],
  statementList: [
    returnStatement(
      ts.notEqual(
        ts.getByExpr(parameterBinary, parameterIndex),
        ts.numberLiteral(0)
      ),
      ts.addition(parameterIndex, ts.numberLiteral(1))
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
): ts.Function => ({
  name: functionName,
  document: "",
  parameterList,
  typeParameterList: [],
  returnType: returnType(ts.typeString),
  statementList: [
    returnStatement(
      ts.callMethod(
        ts.callMethod(
          ts.callMethod(
            ts.globalObjects(identifer.fromString("Array")),
            "from",
            [
              ts.callMethod(parameterBinary, "slice", [
                parameterIndex,
                ts.addition(parameterIndex, ts.numberLiteral(byteSize))
              ])
            ]
          ),
          "map",
          [
            ts.lambda(
              [
                {
                  name: identifer.fromString("n"),
                  type_: ts.typeNumber
                }
              ],
              ts.typeString,
              [
                ts.statementReturn(
                  ts.callMethod(
                    ts.callMethod(
                      ts.variable(identifer.fromString("n")),
                      "toString",
                      [ts.numberLiteral(16)]
                    ),
                    "padStart",
                    [ts.numberLiteral(2), ts.stringLiteral("0")]
                  )
                )
              ]
            )
          ]
        ),
        "join",
        [ts.stringLiteral("")]
      ),

      ts.addition(parameterIndex, ts.numberLiteral(byteSize))
    )
  ]
});

/* ========================================
                  List
   ========================================
*/
const listName = identifer.fromString("decodeList");

const listCode = (): ts.Function => {
  const elementTypeName = identifer.fromString("T");
  const elementTypeVar = ts.typeScopeInFile(elementTypeName);
  const decodeFunctionName = identifer.fromString("decodeFunction");
  const decodeFunctionVar = ts.variable(decodeFunctionName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const resultAndNextIndexName = identifer.fromString("resultAndNextIndex");
  const resultAndNextIndexVar = ts.variable(resultAndNextIndexName);

  return {
    name: listName,
    document: "",
    parameterList: [
      {
        name: decodeFunctionName,
        document: "",
        type_: ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(elementTypeVar)
        )
      }
    ],
    returnType: ts.typeFunction(
      [ts.typeNumber, ts.uint8ArrayType],
      returnType(ts.readonlyArrayType(elementTypeVar))
    ),
    typeParameterList: [elementTypeName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
          parameterList,
          returnType(ts.readonlyArrayType(elementTypeVar)),
          [
            ts.statementVariableDefinition(
              identifer.fromString("length"),
              ts.typeNumber,
              ts.getByExpr(parameterBinary, parameterIndex)
            ),
            ts.statementVariableDefinition(
              resultName,
              ts.arrayType(elementTypeVar),
              ts.arrayLiteral([])
            ),
            ts.statementFor(
              identifer.fromString("i"),
              ts.variable(identifer.fromString("length")),
              [
                ts.statementVariableDefinition(
                  resultAndNextIndexName,
                  returnType(elementTypeVar),
                  ts.call(decodeFunctionVar, [parameterIndex, parameterBinary])
                ),
                ts.statementEvaluateExpr(
                  ts.callMethod(resultVar, "push", [
                    getResult(resultAndNextIndexVar)
                  ])
                ),
                ts.statementSet(
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

const maybeCode = (): ts.Function => {
  const decodeFunctionName = identifer.fromString("decodeFunction");
  const elementTypeName = identifer.fromString("T");
  const elementTypeVar = ts.typeScopeInFile(elementTypeName);
  const patternIndexAndNextIndexName = identifer.fromString(
    "patternIndexAndNextIndex"
  );
  const patternIndexAndNextIndexVar = ts.variable(patternIndexAndNextIndexName);

  const body: ReadonlyArray<ts.Statement> = [
    ts.statementVariableDefinition(
      patternIndexAndNextIndexName,
      returnType(ts.typeNumber),
      intVarEval(parameterIndex, parameterBinary)
    ),
    ts.statementIf(
      ts.equal(getResult(patternIndexAndNextIndexVar), ts.numberLiteral(0)),
      [
        ts.statementVariableDefinition(
          identifer.fromString("valueAndNextIndex"),
          returnType(elementTypeVar),
          ts.call(ts.variable(decodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.maybeJustVarEval(
            getResult(ts.variable(identifer.fromString("valueAndNextIndex")))
          ),
          getNextIndex(ts.variable(identifer.fromString("valueAndNextIndex")))
        )
      ]
    ),
    ts.statementIf(
      ts.equal(getResult(patternIndexAndNextIndexVar), ts.numberLiteral(1)),
      [
        returnStatement(
          tag.maybeNothingVarEval,
          getNextIndex(patternIndexAndNextIndexVar)
        )
      ]
    ),
    ts.statementThrowError(
      ts.stringLiteral(
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
        type_: ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(elementTypeVar)
        )
      }
    ],
    returnType: ts.typeFunction(
      [ts.typeNumber, ts.uint8ArrayType],
      returnType(typeDef.maybeVar(elementTypeVar))
    ),
    typeParameterList: [elementTypeName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
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

const resultCode = (): ts.Function => {
  const okTypeName = identifer.fromString("ok");
  const okTypeVar = ts.typeScopeInFile(okTypeName);
  const errorTypeName = identifer.fromString("error");
  const errorTypeVar = ts.typeScopeInFile(errorTypeName);
  const okDecodeFunctionName = identifer.fromString("okDecodeFunction");
  const errorDecodeFunctionName = identifer.fromString("errorDecodeFunction");
  const patternIndexAndNextIndexName = identifer.fromString(
    "patternIndexAndNextIndex"
  );
  const patternIndexAndNextIndexVar = ts.variable(patternIndexAndNextIndexName);

  const body: ReadonlyArray<ts.Statement> = [
    ts.statementVariableDefinition(
      patternIndexAndNextIndexName,
      returnType(ts.typeNumber),
      intVarEval(parameterIndex, parameterBinary)
    ),
    ts.statementIf(
      ts.equal(getResult(patternIndexAndNextIndexVar), ts.numberLiteral(0)),
      [
        ts.statementVariableDefinition(
          identifer.fromString("okAndNextIndex"),
          returnType(okTypeVar),
          ts.call(ts.variable(okDecodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.resultOkVarEval(
            getResult(ts.variable(identifer.fromString("okAndNextIndex")))
          ),
          getNextIndex(ts.variable(identifer.fromString("okAndNextIndex")))
        )
      ]
    ),
    ts.statementIf(
      ts.equal(getResult(patternIndexAndNextIndexVar), ts.numberLiteral(1)),
      [
        ts.statementVariableDefinition(
          identifer.fromString("errorAndNextIndex"),
          returnType(errorTypeVar),
          ts.call(ts.variable(errorDecodeFunctionName), [
            getNextIndex(patternIndexAndNextIndexVar),
            parameterBinary
          ])
        ),
        returnStatement(
          tag.resultErrorVarEval(
            getResult(ts.variable(identifer.fromString("errorAndNextIndex")))
          ),
          getNextIndex(ts.variable(identifer.fromString("errorAndNextIndex")))
        )
      ]
    ),
    ts.statementThrowError(
      ts.stringLiteral(
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
        type_: ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(okTypeVar)
        )
      },
      {
        name: errorDecodeFunctionName,
        document: "",
        type_: ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(errorTypeVar)
        )
      }
    ],
    returnType: ts.typeFunction(
      [ts.typeNumber, ts.uint8ArrayType],
      returnType(typeDef.resultVar(okTypeVar, errorTypeVar))
    ),
    typeParameterList: [okTypeName, errorTypeName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
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

const customCode = (customType: type.CustomType): ts.Function => {
  const statementList = ((): ReadonlyArray<ts.Statement> => {
    switch (customType.body._) {
      case "Sum":
        return customSumCode(
          customType.name,
          customType.body.tagNameAndParameterArray
        );
      case "Product":
        return customProductCode(customType.body.memberNameAndTypeArray);
    }
  })();

  return {
    name: customName(customType.name),
    document: "",
    parameterList: parameterList,
    typeParameterList: [],
    returnType: returnType(
      util.typeToTypeScriptType(type.typeCustom(customType.name))
    ),
    statementList: statementList
  };
};

const customSumCode = (
  customTypeName: string,
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyArray<ts.Statement> => {
  const patternIndexAndNextIndexName = identifer.fromString("patternIndex");
  const patternIndexAndNextIndexVar = ts.variable(patternIndexAndNextIndexName);

  const isProductTypeAllNoParameter = type.isProductTypeAllNoParameter(
    tagNameAndParameterList
  );
  return [
    ts.statementVariableDefinition(
      patternIndexAndNextIndexName,
      returnType(ts.typeNumber),
      intVarEval(parameterIndex, parameterBinary)
    ),
    ...tagNameAndParameterList.map((tagNameAndParameter, index) =>
      tagNameAndParameterCode(
        customTypeName,
        tagNameAndParameter,
        index,
        patternIndexAndNextIndexVar,
        isProductTypeAllNoParameter
      )
    ),
    ts.statementThrowError(
      ts.stringLiteral("存在しないパターンを指定された 型を更新してください")
    )
  ];
};

const tagNameAndParameterCode = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter,
  index: number,
  patternIndexAndNextIndexVar: ts.Expr,
  isProductTypeAllNoParameter: boolean
): ts.Statement => {
  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.statementIf(
        ts.equal(
          getResult(patternIndexAndNextIndexVar),
          ts.numberLiteral(index)
        ),
        [
          ts.statementVariableDefinition(
            identifer.fromString("result"),
            returnType(
              util.typeToTypeScriptType(tagNameAndParameter.parameter.value)
            ),
            decodeVarEval(
              tagNameAndParameter.parameter.value,
              getNextIndex(patternIndexAndNextIndexVar),
              parameterBinary
            )
          ),
          returnStatement(
            ts.call(
              tag.customTypeVar(customTypeName, tagNameAndParameter.name),
              [getResult(ts.variable(identifer.fromString("result")))]
            ),
            getNextIndex(ts.variable(identifer.fromString("result")))
          )
        ]
      );
    case "Nothing":
      return ts.statementIf(
        ts.equal(
          getResult(patternIndexAndNextIndexVar),
          ts.numberLiteral(index)
        ),
        [
          returnStatement(
            isProductTypeAllNoParameter
              ? ts.stringLiteral(tagNameAndParameter.name)
              : tag.customTypeVar(customTypeName, tagNameAndParameter.name),
            getNextIndex(patternIndexAndNextIndexVar)
          )
        ]
      );
  }
};

const customProductCode = (
  memberNameAndTypeList: ReadonlyArray<type.MemberNameAndType>
): ReadonlyArray<ts.Statement> => {
  const resultAndNextIndexNameIdentifer = (
    memberNameAndType: type.MemberNameAndType
  ): identifer.Identifer =>
    identifer.fromString(memberNameAndType.name + "AndNextIndex");

  const memberDecoderCode = memberNameAndTypeList.reduce<{
    nextIndexExpr: ts.Expr;
    statementList: ReadonlyArray<ts.Statement>;
  }>(
    (data, memberNameAndType) => {
      const resultAndNextIndexName = resultAndNextIndexNameIdentifer(
        memberNameAndType
      );
      const resultAndNextIndexVar = ts.variable(resultAndNextIndexName);

      return {
        nextIndexExpr: getNextIndex(resultAndNextIndexVar),
        statementList: data.statementList.concat(
          ts.statementVariableDefinition(
            resultAndNextIndexName,
            returnType(util.typeToTypeScriptType(memberNameAndType.memberType)),
            decodeVarEval(
              memberNameAndType.memberType,
              data.nextIndexExpr,
              parameterBinary
            )
          )
        )
      };
    },
    { nextIndexExpr: parameterIndex, statementList: [] }
  );
  return memberDecoderCode.statementList.concat(
    returnStatement(
      ts.objectLiteral(
        new Map(
          memberNameAndTypeList.map((memberNameAndType): [string, ts.Expr] => [
            memberNameAndType.name,
            getResult(
              ts.variable(resultAndNextIndexNameIdentifer(memberNameAndType))
            )
          ])
        )
      ),
      memberDecoderCode.nextIndexExpr
    )
  );
};

const decodeVarEval = (
  type_: type.Type,
  indexExpr: ts.Expr,
  binaryExpr: ts.Expr
): ts.Expr => {
  return ts.call(decodeFunctionExpr(type_), [indexExpr, binaryExpr]);
};

const decodeFunctionExpr = (type_: type.Type): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return ts.variable(int32Name);
    case "Int64":
      return ts.variable();
    case "String":
      return ts.variable(stringName);
    case "Bool":
      return ts.variable(boolName);
    case "List":
      return ts.call(ts.variable(listName), [decodeFunctionExpr(type_.type_)]);
    case "Maybe":
      return ts.call(ts.variable(maybeName), [decodeFunctionExpr(type_.type_)]);
    case "Result":
      return ts.call(ts.variable(resultName), [
        decodeFunctionExpr(type_.resultType.ok),
        decodeFunctionExpr(type_.resultType.error)
      ]);
    case "Id":
      return ts.typeAssertion(
        ts.variable(idName),
        ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(ts.typeScopeInFile(identifer.fromString(type_.string_)))
        )
      );
    case "Token":
      return ts.typeAssertion(
        ts.variable(tokenName),
        ts.typeFunction(
          [ts.typeNumber, ts.uint8ArrayType],
          returnType(ts.typeScopeInFile(identifer.fromString(type_.string_)))
        )
      );
    case "Custom":
      return ts.variable(customName(type_.string_));
  }
};
