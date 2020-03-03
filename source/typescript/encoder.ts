import { data, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as typeScript from "./type";

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
    data.definitionFunction(encodeHexString(16, encodeIdName)),
    data.definitionFunction(encodeHexString(32, encodeHashOrAccessTokenName)),
    ...customTypeList.map(customType =>
      data.definitionFunction(customCode(customType))
    )
  ];
};

const encodeIdName = identifer.fromString("encodeId");
const encodeHashOrAccessTokenName = identifer.fromString(
  "encodeHashOrAccessToken"
);

/**
 * `ReadonlyArray<number>`
 * を表現する
 */
const readonlyArrayNumber: data.Type = data.readonlyArrayType(data.typeNumber);

export const encodeVarEval = (type_: type.Type, expr: data.Expr): data.Expr => {
  return data.call(encodeFunctionExpr(type_), [expr]);
};

const encodeFunctionExpr = (type_: type.Type): data.Expr => {
  switch (type_._) {
    case "UInt32":
      return data.variable(uInt32Name);
    case "String":
      return data.variable(stringName);
    case "Bool":
      return data.variable(boolName);
    case "DateTime":
      return data.variable(dateTimeName);
    case "List":
      return data.call(data.variable(listName), [
        encodeFunctionExpr(type_.type_)
      ]);
    case "Maybe":
      return data.call(data.variable(maybeName), [
        encodeFunctionExpr(type_.type_)
      ]);
    case "Result":
      return data.call(data.variable(resultName), [
        encodeFunctionExpr(type_.resultType.ok),
        encodeFunctionExpr(type_.resultType.error)
      ]);
    case "Id":
      return data.variable(encodeIdName);
    case "Hash":
    case "AccessToken":
      return data.variable(encodeHashOrAccessTokenName);
    case "Custom":
      return data.variable(customName(type_.string_));
  }
};

/* ========================================
                  UInt32
   ========================================
*/

const uInt32Name = identifer.fromString("encodeUInt32");

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
const uInt32Code: data.Function = {
  name: uInt32Name,
  document:
    "numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード",
  parameterList: [
    {
      name: identifer.fromString("num"),
      type_: data.typeNumber,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    data.statementSet(
      data.variable(identifer.fromString("num")),
      null,
      data.callMathMethod("floor", [
        data.callMathMethod("max", [
          data.numberLiteral(0),
          data.callMathMethod("min", [
            data.variable(identifer.fromString("num")),
            data.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    data.statementVariableDefinition(
      identifer.fromString("numberArray"),
      data.arrayType(data.typeNumber),
      data.arrayLiteral([])
    ),
    data.statementWhileTrue([
      data.statementVariableDefinition(
        identifer.fromString("b"),
        data.typeNumber,
        data.bitwiseAnd(
          data.variable(identifer.fromString("num")),
          data.numberLiteral(0b1111111)
        )
      ),
      data.statementSet(
        data.variable(identifer.fromString("num")),
        null,
        data.unsignedRightShift(
          data.variable(identifer.fromString("num")),
          data.numberLiteral(7)
        )
      ),
      data.statementIf(
        data.equal(
          data.variable(identifer.fromString("num")),
          data.numberLiteral(0)
        ),
        [
          data.statementEvaluateExpr(
            data.callMethod(
              data.variable(identifer.fromString("numberArray")),
              "push",
              [data.variable(identifer.fromString("b"))]
            )
          ),
          data.statementReturn(
            data.variable(identifer.fromString("numberArray"))
          )
        ]
      ),
      data.statementEvaluateExpr(
        data.callMethod(
          data.variable(identifer.fromString("numberArray")),
          "push",
          [
            data.bitwiseOr(
              data.variable(identifer.fromString("b")),
              data.numberLiteral(0b10000000)
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
const stringCode = (isBrowser: boolean): data.Function => ({
  name: stringName,
  document:
    "stringからバイナリに変換する. このコードは" +
    (isBrowser
      ? "ブラウザ用なのでグローバルのTextDecoderを使う"
      : "Node.js用なのでutilのTextDecoderを使う"),
  parameterList: [
    {
      name: identifer.fromString("text"),
      type_: data.typeString,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    data.statementReturn(
      data.callMethod(
        data.globalObjects(identifer.fromString("Array")),
        "from",
        [
          data.callMethod(
            data.newExpr(
              isBrowser
                ? data.globalObjects(identifer.fromString("TextEncoder"))
                : data.importedVariable(
                    "util",
                    identifer.fromString("TextEncoder")
                  ),
              []
            ),
            "encode",
            [data.variable(identifer.fromString("text"))]
          )
        ]
      )
    )
  ]
});

/* ========================================
                  Bool
   ========================================
*/
const boolName = identifer.fromString("encodeBool");

const boolCode: data.Function = {
  name: boolName,
  document: "boolからバイナリに変換する",
  parameterList: [
    {
      name: identifer.fromString("value"),
      type_: data.typeBoolean,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    data.statementReturn(
      data.arrayLiteral([
        data.conditionalOperator(
          data.variable(identifer.fromString("value")),
          data.numberLiteral(1),
          data.numberLiteral(0)
        )
      ])
    )
  ]
};

/* ========================================
                DateTime
   ========================================
*/

const dateTimeName = identifer.fromString("encodeDateTime");

const dateTimeCode: data.Function = {
  name: dateTimeName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("dateTime"),
      document: "",
      type_: data.dateType
    }
  ],
  returnType: readonlyArrayNumber,
  typeParameterList: [],
  statementList: [
    data.statementReturn(
      encodeVarEval(
        type.typeUInt32,
        data.callMathMethod("floor", [
          data.division(
            data.callMethod(
              data.variable(identifer.fromString("dateTime")),
              "getTime",
              []
            ),
            data.numberLiteral(1000)
          )
        ])
      )
    )
  ]
};

/* ========================================
            HexString (Id / Hash)
   ========================================
*/

const encodeHexString = (
  byteSize: number,
  functionName: identifer.Identifer
): data.Function => {
  const idName = identifer.fromString("id");
  const idVar = data.variable(idName);
  const resultName = identifer.fromString("result");
  const resultVar = data.variable(resultName);
  const iName = identifer.fromString("i");
  const iVar = data.variable(iName);

  return {
    name: functionName,
    document: "",
    parameterList: [
      {
        name: idName,
        type_: data.typeString,
        document: ""
      }
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: [
      data.statementVariableDefinition(
        resultName,
        data.arrayType(data.typeNumber),
        data.arrayLiteral([])
      ),
      data.statementFor(iName, data.numberLiteral(byteSize), [
        data.statementSet(
          data.getByExpr(resultVar, iVar),
          null,
          data.callNumberMethod("parseInt", [
            data.callMethod(idVar, "slice", [
              data.multiplication(iVar, data.numberLiteral(2)),
              data.addition(
                data.multiplication(iVar, data.numberLiteral(2)),
                data.numberLiteral(2)
              )
            ]),
            data.numberLiteral(16)
          ])
        )
      ]),
      data.statementReturn(resultVar)
    ]
  };
};

/* ========================================
                List
   ========================================
*/

const listName = identifer.fromString("encodeList");

const listCode = (): data.Function => {
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
        type_: data.typeFunction(
          [data.typeScopeInFile(elementTypeName)],
          readonlyArrayNumber
        )
      }
    ],
    typeParameterList: [elementTypeName],
    returnType: data.typeFunction(
      [data.readonlyArrayType(data.typeScopeInFile(elementTypeName))],
      readonlyArrayNumber
    ),
    statementList: [
      data.statementReturn(
        data.lambda(
          [
            {
              name: parameterList,
              type_: data.readonlyArrayType(
                data.typeScopeInFile(elementTypeName)
              )
            }
          ],
          readonlyArrayNumber,
          [
            data.statementLetVariableDefinition(
              resultName,
              data.arrayType(data.typeNumber),
              data.arrayLiteral([])
            ),
            data.statementForOf(elementName, data.variable(parameterList), [
              data.statementSet(
                data.variable(resultName),
                null,
                data.callMethod(data.variable(resultName), "concat", [
                  data.call(data.variable(encodeFunctionName), [
                    data.variable(elementName)
                  ])
                ])
              )
            ]),
            data.statementReturn(data.variable(resultName))
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

const maybeCode = (): data.Function => {
  const encodeFunctionName = identifer.fromString("encodeFunction");
  const encodeFunctionVar = data.variable(encodeFunctionName);
  const elementTypeName = identifer.fromString("T");
  const maybeName = identifer.fromString("maybe");
  const maybeVar = data.variable(maybeName);

  return {
    name: maybeName,
    document: "",
    returnType: data.typeFunction(
      [
        data.typeWithParameter(
          data.typeScopeInFile(identifer.fromString("Maybe")),
          [data.typeScopeInFile(elementTypeName)]
        )
      ],
      readonlyArrayNumber
    ),
    parameterList: [
      {
        name: encodeFunctionName,
        document: "",
        type_: data.typeFunction(
          [data.typeScopeInFile(elementTypeName)],
          readonlyArrayNumber
        )
      }
    ],
    typeParameterList: [elementTypeName],
    statementList: [
      data.statementReturn(
        data.lambda(
          [
            {
              name: maybeName,
              type_: data.typeWithParameter(
                data.typeScopeInFile(identifer.fromString("Maybe")),
                [data.typeScopeInFile(elementTypeName)]
              )
            }
          ],
          readonlyArrayNumber,
          [
            data.statementSwitch({
              expr: data.get(maybeVar, "_"),
              patternList: [
                {
                  caseTag: "Just",
                  statementList: [
                    data.statementReturn(
                      data.callMethod(
                        data.arrayLiteral([data.numberLiteral(0)]),
                        "concat",
                        [
                          data.call(encodeFunctionVar, [
                            data.get(maybeVar, "value")
                          ])
                        ]
                      )
                    )
                  ]
                },
                {
                  caseTag: "Nothing",
                  statementList: [
                    data.statementReturn(
                      data.arrayLiteral([data.numberLiteral(1)])
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
                Result
   ========================================
*/
const resultName = identifer.fromString("encodeResult");

const resultCode = (): data.Function => {
  const okName = identifer.fromString("ok");
  const okTypeVar = data.typeScopeInFile(okName);
  const errorName = identifer.fromString("error");
  const errorTypeVar = data.typeScopeInFile(errorName);
  const parameterResultName = identifer.fromString("result");
  const parameterResultVar = data.variable(parameterResultName);
  const resultType = data.typeWithParameter(
    data.typeScopeInFile(identifer.fromString("Result")),
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
        type_: data.typeFunction([okTypeVar], readonlyArrayNumber)
      },
      {
        name: errorEncodeFunctionName,
        document: "",
        type_: data.typeFunction([errorTypeVar], readonlyArrayNumber)
      }
    ],
    returnType: data.typeFunction([resultType], readonlyArrayNumber),
    typeParameterList: [okName, errorName],
    statementList: [
      data.statementReturn(
        data.lambda(
          [
            {
              name: parameterResultName,
              type_: resultType
            }
          ],
          readonlyArrayNumber,
          [
            data.statementSwitch({
              expr: data.get(parameterResultVar, "_"),
              patternList: [
                {
                  caseTag: "Ok",
                  statementList: [
                    data.statementReturn(
                      data.callMethod(
                        data.arrayLiteral([data.numberLiteral(0)]),
                        "concat",
                        [
                          data.call(data.variable(okEncodeFunctionName), [
                            data.get(parameterResultVar, "ok")
                          ])
                        ]
                      )
                    )
                  ]
                },
                {
                  caseTag: "Error",
                  statementList: [
                    data.statementReturn(
                      data.callMethod(
                        data.arrayLiteral([data.numberLiteral(1)]),
                        "concat",
                        [
                          data.call(data.variable(errorEncodeFunctionName), [
                            data.get(parameterResultVar, "error")
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

export const customCode = (customType: type.CustomType): data.Function => {
  const parameterName = typeScript.typeToMemberOrParameterName(
    type.typeCustom(customType.name)
  );
  const parameterVar = data.variable(parameterName);

  const statementList = ((): ReadonlyArray<data.Statement> => {
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
        type_: typeScript.typeToGeneratorType(type.typeCustom(customType.name))
      }
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList
  };
};

export const customProductCode = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  parameter: data.Expr
): ReadonlyArray<data.Statement> => {
  let e = encodeVarEval(
    memberNameAndTypeArray[0].memberType,
    data.get(parameter, memberNameAndTypeArray[0].name)
  );
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = data.callMethod(e, "concat", [
      encodeVarEval(
        memberNameAndType.memberType,
        data.get(parameter, memberNameAndType.name)
      )
    ]);
  }
  return [data.statementReturn(e)];
};

export const customSumCode = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  parameter: data.Expr
): ReadonlyArray<data.Statement> => {
  if (typeScript.isProductTypeAllNoParameter(tagNameAndParameterArray)) {
    return [
      data.statementSwitch({
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
    data.statementSwitch({
      expr: data.get(parameter, "_"),
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
  parameter: data.Expr
): data.Pattern => {
  const returnExpr = ((): data.Expr => {
    switch (tagNameAndParameter.parameter._) {
      case "Just":
        return data.callMethod(
          data.arrayLiteral([data.numberLiteral(index)]),
          "concat",
          [
            encodeVarEval(
              tagNameAndParameter.parameter.value,
              data.get(
                parameter,
                typeScript.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.value
                )
              )
            )
          ]
        );

      case "Nothing":
        return data.arrayLiteral([data.numberLiteral(index)]);
    }
  })();
  return {
    caseTag: tagNameAndParameter.name,
    statementList: [data.statementReturn(returnExpr)]
  };
};
