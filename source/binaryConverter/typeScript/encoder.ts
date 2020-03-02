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

const encodeIdName = generator.identifer.fromString("encodeId");
const encodeHashOrAccessTokenName = generator.identifer.fromString(
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

const uInt32Name = generator.identifer.fromString("encodeUInt32");

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
const uInt32Code: data.Function = {
  name: uInt32Name,
  document:
    "numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード",
  parameterList: [
    {
      name: generator.identifer.fromString("num"),
      type_: data.typeNumber,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    data.statementSet(
      data.variable(generator.identifer.fromString("num")),
      null,
      data.callMathMethod("floor", [
        data.callMathMethod("max", [
          data.numberLiteral(0),
          data.callMathMethod("min", [
            data.variable(generator.identifer.fromString("num")),
            data.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    data.statementVariableDefinition(
      generator.identifer.fromString("numberArray"),
      data.arrayType(data.typeNumber),
      data.arrayLiteral([])
    ),
    data.statementWhileTrue([
      data.statementVariableDefinition(
        generator.identifer.fromString("b"),
        data.typeNumber,
        data.bitwiseAnd(
          data.variable(generator.identifer.fromString("num")),
          data.numberLiteral(0b1111111)
        )
      ),
      data.statementSet(
        data.variable(generator.identifer.fromString("num")),
        null,
        data.unsignedRightShift(
          data.variable(generator.identifer.fromString("num")),
          data.numberLiteral(7)
        )
      ),
      data.statementIf(
        data.equal(
          data.variable(generator.identifer.fromString("num")),
          data.numberLiteral(0)
        ),
        [
          data.statementEvaluateExpr(
            data.callMethod(
              data.variable(generator.identifer.fromString("numberArray")),
              "push",
              [data.variable(generator.identifer.fromString("b"))]
            )
          ),
          data.statementReturn(
            data.variable(generator.identifer.fromString("numberArray"))
          )
        ]
      ),
      data.statementEvaluateExpr(
        data.callMethod(
          data.variable(generator.identifer.fromString("numberArray")),
          "push",
          [
            data.bitwiseOr(
              data.variable(generator.identifer.fromString("b")),
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

const stringName = generator.identifer.fromString("encodeString");
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
      name: generator.identifer.fromString("text"),
      type_: data.typeString,
      document: ""
    }
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    data.statementReturn(
      data.callMethod(
        data.globalObjects(generator.identifer.fromString("Array")),
        "from",
        [
          data.callMethod(
            data.newExpr(
              isBrowser
                ? data.globalObjects(
                    generator.identifer.fromString("TextEncoder")
                  )
                : data.importedVariable(
                    "util",
                    generator.identifer.fromString("TextEncoder")
                  ),
              []
            ),
            "encode",
            [data.variable(generator.identifer.fromString("text"))]
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
const boolName = generator.identifer.fromString("encodeBool");

const boolCode: data.Function = {
  name: boolName,
  document: "boolからバイナリに変換する",
  parameterList: [
    {
      name: generator.identifer.fromString("value"),
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
          data.variable(generator.identifer.fromString("value")),
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

const dateTimeName = generator.identifer.fromString("encodeDateTime");

const dateTimeCode: data.Function = {
  name: dateTimeName,
  document: "",
  parameterList: [
    {
      name: generator.identifer.fromString("dateTime"),
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
              data.variable(generator.identifer.fromString("dateTime")),
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
  functionName: generator.identifer.Identifer
): data.Function => {
  const idName = generator.identifer.fromString("id");
  const idVar = data.variable(idName);
  const resultName = generator.identifer.fromString("result");
  const resultVar = data.variable(resultName);
  const iName = generator.identifer.fromString("i");
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

const listName = generator.identifer.fromString("encodeList");

const listCode = (): data.Function => {
  const elementTypeName = generator.identifer.fromString("T");
  const parameterList = generator.identifer.fromString("list");
  const resultName = generator.identifer.fromString("result");
  const elementName = generator.identifer.fromString("element");
  const encodeFunctionName = generator.identifer.fromString("encodeFunction");

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
const maybeName = generator.identifer.fromString("encodeMaybe");

const maybeCode = (): data.Function => {
  const encodeFunctionName = generator.identifer.fromString("encodeFunction");
  const encodeFunctionVar = data.variable(encodeFunctionName);
  const elementTypeName = generator.identifer.fromString("T");
  const maybeName = generator.identifer.fromString("maybe");
  const maybeVar = data.variable(maybeName);

  return {
    name: maybeName,
    document: "",
    returnType: data.typeFunction(
      [
        data.typeWithParameter(
          data.typeScopeInFile(generator.identifer.fromString("Maybe")),
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
                data.typeScopeInFile(generator.identifer.fromString("Maybe")),
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
const resultName = generator.identifer.fromString("encodeResult");

const resultCode = (): data.Function => {
  const okName = generator.identifer.fromString("ok");
  const okTypeVar = data.typeScopeInFile(okName);
  const errorName = generator.identifer.fromString("error");
  const errorTypeVar = data.typeScopeInFile(errorName);
  const parameterResultName = generator.identifer.fromString("result");
  const parameterResultVar = data.variable(parameterResultName);
  const resultType = data.typeWithParameter(
    data.typeScopeInFile(generator.identifer.fromString("Result")),
    [okTypeVar, errorTypeVar]
  );
  const errorEncodeFunctionName = generator.identifer.fromString(
    "errorEncodeFunction"
  );
  const okEncodeFunctionName = generator.identifer.fromString(
    "okEncodeFunction"
  );

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

const customName = (customTypeName: string): generator.identifer.Identifer =>
  generator.identifer.fromString("encodeCustom" + customTypeName);

export const customCode = (customType: type.CustomType): data.Function => {
  const parameterName = typeScript.typeToMemberOrParameterName(
    type.typeCustom(customType.name)
  );

  const returnExpr = ((): ReadonlyArray<data.Statement> => {
    switch (customType.body._) {
      case "Product":
        return customProductCode(
          customType.body.memberNameAndTypeArray,
          (memberName: string) =>
            data.get(
              data.variable(generator.identifer.fromString(parameterName)),
              memberName
            )
        );
      case "Sum":
        return customSumCode(
          customType.name,
          customType.body.tagNameAndParameterArray,
          (memberName: string) =>
            data.get(
              data.variable(generator.identifer.fromString(parameterName)),
              memberName
            )
        );
    }
  })();

  return {
    name: customName(customType.name),
    document: "",
    parameterList: [
      {
        name: generator.identifer.fromString(parameterName),
        document: "",
        type_: typeScript.typeToGeneratorType(type.typeCustom(customType.name))
      }
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: returnExpr
  };
};

export const customProductCode = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  get: (memberName: string) => data.Expr
): ReadonlyArray<data.Statement> => {
  let e = encodeVarEval(
    memberNameAndTypeArray[0].memberType,
    get(memberNameAndTypeArray[0].name)
  );
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = data.callMethod(e, "concat", [
      encodeVarEval(memberNameAndType.memberType, get(memberNameAndType.name))
    ]);
  }
  return [data.statementReturn(e)];
};

export const customSumCode = (
  customTypeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  get: (memberName: string) => data.Expr
): ReadonlyArray<data.Statement> => {
  const statementList: Array<data.Statement> = [
    data.statementLetVariableDefinition(
      generator.identifer.fromString("result"),
      data.arrayType(data.typeNumber),
      data.arrayLiteral([])
    ),
    data.statementSet(
      data.variable(generator.identifer.fromString("result")),
      null,
      data.callMethod(
        data.variable(generator.identifer.fromString("result")),
        "concat",
        [encodeVarEval(type.typeUInt32, get("_"))]
      )
    )
  ];
  for (const tagNameAndParameter of tagNameAndParameterArray) {
    switch (tagNameAndParameter.parameter._) {
      case "Just":
        statementList.push(
          data.statementIf(
            data.equal(get("_"), data.stringLiteral(tagNameAndParameter.name)),
            [
              data.statementReturn(
                data.callMethod(
                  data.variable(generator.identifer.fromString("result")),
                  "concat",
                  [
                    encodeVarEval(
                      tagNameAndParameter.parameter.value,
                      get(
                        typeScript.typeToMemberOrParameterName(
                          tagNameAndParameter.parameter.value
                        )
                      )
                    )
                  ]
                )
              )
            ]
          )
        );
    }
  }
  return statementList.concat([
    data.statementThrowError(
      data.addition(
        data.stringLiteral(customTypeName + " type tag index error. index = "),
        data.callMethod(get("_"), "toString", [])
      )
    )
  ]);
};
