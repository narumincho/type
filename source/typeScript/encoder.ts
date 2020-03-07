import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";

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
    encodeHexString(16, encodeIdName),
    encodeHexString(32, encodeTokenName),
    ...customTypeList.map(customType => customCode(customType))
  ];
};

const encodeIdName = identifer.fromString("encodeId");
const encodeTokenName = identifer.fromString("encodeHashOrAccessToken");

/**
 * `ReadonlyArray<number>`
 * を表現する
 */
const readonlyArrayNumber: ts.Type = ts.readonlyArrayType(ts.typeNumber);

/* ========================================
                  Int32
   ========================================
*/

const int32Name = identifer.fromString("encodeInt32");

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
const int32Code: ts.Function = {
  name: int32Name,
  document:
    "numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード",
  parameterList: [
    {
      name: identifer.fromString("num"),
      type_: ts.typeNumber,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    ts.statementSet(
      ts.variable(identifer.fromString("num")),
      null,
      ts.callMathMethod("floor", [
        ts.callMathMethod("max", [
          ts.numberLiteral(0),
          ts.callMathMethod("min", [
            ts.variable(identifer.fromString("num")),
            ts.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    ts.statementVariableDefinition(
      identifer.fromString("numberArray"),
      ts.arrayType(ts.typeNumber),
      ts.arrayLiteral([])
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        identifer.fromString("b"),
        ts.typeNumber,
        ts.bitwiseAnd(
          ts.variable(identifer.fromString("num")),
          ts.numberLiteral(0b1111111)
        )
      ),
      ts.statementSet(
        ts.variable(identifer.fromString("num")),
        null,
        ts.unsignedRightShift(
          ts.variable(identifer.fromString("num")),
          ts.numberLiteral(7)
        )
      ),
      ts.statementIf(
        ts.equal(ts.variable(identifer.fromString("num")), ts.numberLiteral(0)),
        [
          ts.statementEvaluateExpr(
            ts.callMethod(
              ts.variable(identifer.fromString("numberArray")),
              "push",
              [ts.variable(identifer.fromString("b"))]
            )
          ),
          ts.statementReturn(ts.variable(identifer.fromString("numberArray")))
        ]
      ),
      ts.statementEvaluateExpr(
        ts.callMethod(
          ts.variable(identifer.fromString("numberArray")),
          "push",
          [
            ts.bitwiseOr(
              ts.variable(identifer.fromString("b")),
              ts.numberLiteral(0b10000000)
            )
          ]
        )
      )
    ])
  ]
};

/* ========================================
                  String
   ========================================
*/

const stringName = identifer.fromString("encodeString");
/**
 * stringからバイナリに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
const stringCode: ts.Function = {
  name: stringName,
  document: "stringからバイナリに変換する.",
  parameterList: [
    {
      name: identifer.fromString("text"),
      type_: ts.typeString,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    ts.statementReturn(
      ts.callMethod(ts.globalObjects(identifer.fromString("Array")), "from", [
        ts.callMethod(
          ts.newExpr(
            ts.conditionalOperator(
              ts.equal(
                ts.globalObjects(identifer.fromString("process")),
                ts.undefinedLiteral
              ),
              ts.globalObjects(identifer.fromString("TextEncoder")),
              ts.importedVariable("util", identifer.fromString("TextEncoder"))
            ),
            []
          ),
          "encode",
          [ts.variable(identifer.fromString("text"))]
        )
      ])
    )
  ]
};

/* ========================================
                  Bool
   ========================================
*/
const boolName = identifer.fromString("encodeBool");

const boolCode: ts.Function = {
  name: boolName,
  document: "boolからバイナリに変換する",
  parameterList: [
    {
      name: identifer.fromString("value"),
      type_: ts.typeBoolean,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    ts.statementReturn(
      ts.arrayLiteral([
        ts.conditionalOperator(
          ts.variable(identifer.fromString("value")),
          ts.numberLiteral(1),
          ts.numberLiteral(0)
        )
      ])
    )
  ]
};

/* ========================================
            HexString (Id / Token)
   ========================================
*/

const encodeHexString = (
  byteSize: number,
  functionName: identifer.Identifer
): ts.Function => {
  const idName = identifer.fromString("id");
  const idVar = ts.variable(idName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const iName = identifer.fromString("i");
  const iVar = ts.variable(iName);

  return {
    name: functionName,
    document: "",
    parameterList: [
      {
        name: idName,
        type_: ts.typeString,
        document: ""
      }
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: [
      ts.statementVariableDefinition(
        resultName,
        ts.arrayType(ts.typeNumber),
        ts.arrayLiteral([])
      ),
      ts.statementFor(iName, ts.numberLiteral(byteSize), [
        ts.statementSet(
          ts.getByExpr(resultVar, iVar),
          null,
          ts.callNumberMethod("parseInt", [
            ts.callMethod(idVar, "slice", [
              ts.multiplication(iVar, ts.numberLiteral(2)),
              ts.addition(
                ts.multiplication(iVar, ts.numberLiteral(2)),
                ts.numberLiteral(2)
              )
            ]),
            ts.numberLiteral(16)
          ])
        )
      ]),
      ts.statementReturn(resultVar)
    ]
  };
};

/* ========================================
                List
   ========================================
*/

const listName = identifer.fromString("encodeList");

const listCode = (): ts.Function => {
  const elementTypeName = identifer.fromString("T");
  const parameterList = identifer.fromString("list");
  const resultName = identifer.fromString("result");
  const elementName = identifer.fromString("element");
  const encodeFunctionName = identifer.fromString("encodeFunction");

  return {
    name: listName,
    document: "",
    parameterList: [
      {
        name: encodeFunctionName,
        document: "",
        type_: ts.typeFunction(
          [ts.typeScopeInFile(elementTypeName)],
          readonlyArrayNumber
        )
      }
    ],
    typeParameterList: [elementTypeName],
    returnType: ts.typeFunction(
      [ts.readonlyArrayType(ts.typeScopeInFile(elementTypeName))],
      readonlyArrayNumber
    ),
    statementList: [
      ts.statementReturn(
        ts.lambda(
          [
            {
              name: parameterList,
              type_: ts.readonlyArrayType(ts.typeScopeInFile(elementTypeName))
            }
          ],
          readonlyArrayNumber,
          [
            ts.statementLetVariableDefinition(
              resultName,
              ts.arrayType(ts.typeNumber),
              ts.arrayLiteral([])
            ),
            ts.statementForOf(elementName, ts.variable(parameterList), [
              ts.statementSet(
                ts.variable(resultName),
                null,
                ts.callMethod(ts.variable(resultName), "concat", [
                  ts.call(ts.variable(encodeFunctionName), [
                    ts.variable(elementName)
                  ])
                ])
              )
            ]),
            ts.statementReturn(ts.variable(resultName))
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
const maybeName = identifer.fromString("encodeMaybe");

const maybeCode = (): ts.Function => {
  const encodeFunctionName = identifer.fromString("encodeFunction");
  const encodeFunctionVar = ts.variable(encodeFunctionName);
  const elementTypeName = identifer.fromString("T");
  const maybeName = identifer.fromString("maybe");
  const maybeVar = ts.variable(maybeName);

  return {
    name: maybeName,
    document: "",
    returnType: ts.typeFunction(
      [
        ts.typeWithParameter(
          ts.typeScopeInFile(identifer.fromString("Maybe")),
          [ts.typeScopeInFile(elementTypeName)]
        )
      ],
      readonlyArrayNumber
    ),
    parameterList: [
      {
        name: encodeFunctionName,
        document: "",
        type_: ts.typeFunction(
          [ts.typeScopeInFile(elementTypeName)],
          readonlyArrayNumber
        )
      }
    ],
    typeParameterList: [elementTypeName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
          [
            {
              name: maybeName,
              type_: ts.typeWithParameter(
                ts.typeScopeInFile(identifer.fromString("Maybe")),
                [ts.typeScopeInFile(elementTypeName)]
              )
            }
          ],
          readonlyArrayNumber,
          [
            ts.statementSwitch({
              expr: ts.get(maybeVar, "_"),
              patternList: [
                {
                  caseTag: "Just",
                  statementList: [
                    ts.statementReturn(
                      ts.callMethod(
                        ts.arrayLiteral([ts.numberLiteral(0)]),
                        "concat",
                        [
                          ts.call(encodeFunctionVar, [
                            ts.get(maybeVar, "value")
                          ])
                        ]
                      )
                    )
                  ]
                },
                {
                  caseTag: "Nothing",
                  statementList: [
                    ts.statementReturn(ts.arrayLiteral([ts.numberLiteral(1)]))
                  ]
                }
              ]
            })
          ]
        )
      )
    ]
  };
};

/* ========================================
                Result
   ========================================
*/
const resultName = identifer.fromString("encodeResult");

const resultCode = (): ts.Function => {
  const okName = identifer.fromString("ok");
  const okTypeVar = ts.typeScopeInFile(okName);
  const errorName = identifer.fromString("error");
  const errorTypeVar = ts.typeScopeInFile(errorName);
  const parameterResultName = identifer.fromString("result");
  const parameterResultVar = ts.variable(parameterResultName);
  const resultType = ts.typeWithParameter(
    ts.typeScopeInFile(identifer.fromString("Result")),
    [okTypeVar, errorTypeVar]
  );
  const errorEncodeFunctionName = identifer.fromString("errorEncodeFunction");
  const okEncodeFunctionName = identifer.fromString("okEncodeFunction");

  return {
    name: resultName,
    document: "",
    parameterList: [
      {
        name: okEncodeFunctionName,
        document: "",
        type_: ts.typeFunction([okTypeVar], readonlyArrayNumber)
      },
      {
        name: errorEncodeFunctionName,
        document: "",
        type_: ts.typeFunction([errorTypeVar], readonlyArrayNumber)
      }
    ],
    returnType: ts.typeFunction([resultType], readonlyArrayNumber),
    typeParameterList: [okName, errorName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
          [
            {
              name: parameterResultName,
              type_: resultType
            }
          ],
          readonlyArrayNumber,
          [
            ts.statementSwitch({
              expr: ts.get(parameterResultVar, "_"),
              patternList: [
                {
                  caseTag: "Ok",
                  statementList: [
                    ts.statementReturn(
                      ts.callMethod(
                        ts.arrayLiteral([ts.numberLiteral(0)]),
                        "concat",
                        [
                          ts.call(ts.variable(okEncodeFunctionName), [
                            ts.get(parameterResultVar, "ok")
                          ])
                        ]
                      )
                    )
                  ]
                },
                {
                  caseTag: "Error",
                  statementList: [
                    ts.statementReturn(
                      ts.callMethod(
                        ts.arrayLiteral([ts.numberLiteral(1)]),
                        "concat",
                        [
                          ts.call(ts.variable(errorEncodeFunctionName), [
                            ts.get(parameterResultVar, "error")
                          ])
                        ]
                      )
                    )
                  ]
                }
              ]
            })
          ]
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
  identifer.fromString("encodeCustom" + customTypeName);

export const customCode = (customType: type.CustomType): ts.Function => {
  const parameterName = util.typeToMemberOrParameterName(
    type.typeCustom(customType.name)
  );
  const parameterVar = ts.variable(parameterName);

  const statementList = ((): ReadonlyArray<ts.Statement> => {
    switch (customType.body._) {
      case "Product":
        return customProductCode(
          customType.body.memberNameAndTypeArray,
          parameterVar
        );
      case "Sum":
        return customSumCode(
          customType.body.tagNameAndParameterArray,
          parameterVar
        );
    }
  })();

  return {
    name: customName(customType.name),
    document: "",
    parameterList: [
      {
        name: identifer.fromString(parameterName),
        document: "",
        type_: util.typeToTypeScriptType(type.typeCustom(customType.name))
      }
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList
  };
};

export const customProductCode = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  let e = encodeVarEval(
    memberNameAndTypeArray[0].memberType,
    ts.get(parameter, memberNameAndTypeArray[0].name)
  );
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = ts.callMethod(e, "concat", [
      encodeVarEval(
        memberNameAndType.memberType,
        ts.get(parameter, memberNameAndType.name)
      )
    ]);
  }
  return [ts.statementReturn(e)];
};

export const customSumCode = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  if (type.isProductTypeAllNoParameter(tagNameAndParameterArray)) {
    return [
      ts.statementSwitch({
        expr: parameter,
        patternList: tagNameAndParameterArray.map(
          (tagNameAndParameter, index) =>
            tagNameAndParameterToSwitchPattern(
              tagNameAndParameter,
              index,
              parameter
            )
        )
      })
    ];
  }
  return [
    ts.statementSwitch({
      expr: ts.get(parameter, "_"),
      patternList: tagNameAndParameterArray.map((tagNameAndParameter, index) =>
        tagNameAndParameterToSwitchPattern(
          tagNameAndParameter,
          index,
          parameter
        )
      )
    })
  ];
};

const tagNameAndParameterToSwitchPattern = (
  tagNameAndParameter: type.TagNameAndParameter,
  index: number,
  parameter: ts.Expr
): ts.Pattern => {
  const returnExpr = ((): ts.Expr => {
    switch (tagNameAndParameter.parameter._) {
      case "Just":
        return ts.callMethod(
          ts.arrayLiteral([ts.numberLiteral(index)]),
          "concat",
          [
            encodeVarEval(
              tagNameAndParameter.parameter.value,
              ts.get(
                parameter,
                util.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.value
                )
              )
            )
          ]
        );

      case "Nothing":
        return ts.arrayLiteral([ts.numberLiteral(index)]);
    }
  })();
  return {
    caseTag: tagNameAndParameter.name,
    statementList: [ts.statementReturn(returnExpr)]
  };
};

export const encodeVarEval = (type_: type.Type, expr: ts.Expr): ts.Expr => {
  return ts.call(encodeFunctionExpr(type_), [expr]);
};

const encodeFunctionExpr = (type_: type.Type): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return ts.variable(int32Name);
    case "String":
      return ts.variable(stringName);
    case "Bool":
      return ts.variable(boolName);
    case "List":
      return ts.call(ts.variable(listName), [encodeFunctionExpr(type_.type_)]);
    case "Maybe":
      return ts.call(ts.variable(maybeName), [encodeFunctionExpr(type_.type_)]);
    case "Result":
      return ts.call(ts.variable(resultName), [
        encodeFunctionExpr(type_.resultType.ok),
        encodeFunctionExpr(type_.resultType.error)
      ]);
    case "Id":
      return ts.variable(encodeIdName);
    case "Token":
      return ts.variable(encodeTokenName);
    case "Custom":
      return ts.variable(customName(type_.string_));
  }
};
