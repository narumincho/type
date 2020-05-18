import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";

export const generateCode = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): ReadonlyArray<ts.Function> => {
  return [
    int32Code(),
    stringCode(),
    boolCode,
    binaryCode(),
    listCode(),
    maybeCode(),
    resultCode(),
    encodeHexString(16, encodeIdName),
    encodeHexString(32, encodeTokenName),
    ...customTypeList.map((customType) => customCode(customType)),
  ];
};

const encodeIdName = identifer.fromString("encodeId");
const encodeTokenName = identifer.fromString("encodeToken");

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
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換するコード
 */
const int32Code = (): ts.Function => {
  const valueName = identifer.fromString("value");
  const valueVar = ts.variable(valueName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.variable(byteName);

  return {
    name: int32Name,
    document: "numberの32bit符号あり整数をSigned Leb128のバイナリに変換する",
    parameterList: [
      {
        name: valueName,
        type_: ts.typeNumber,
        document: "",
      },
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: [
      ts.statementSet(valueVar, "|", ts.numberLiteral(0)),
      ts.statementVariableDefinition(
        resultName,
        ts.arrayType(ts.typeNumber),
        ts.arrayLiteral([])
      ),
      ts.statementWhileTrue([
        ts.statementVariableDefinition(
          byteName,
          ts.typeNumber,
          ts.bitwiseAnd(valueVar, ts.numberLiteral(0x7f))
        ),
        ts.statementSet(valueVar, ">>", ts.numberLiteral(7)),
        ts.statementIf(
          ts.logicalOr(
            ts.logicalAnd(
              ts.equal(valueVar, ts.numberLiteral(0)),
              ts.equal(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            ),
            ts.logicalAnd(
              ts.equal(valueVar, ts.numberLiteral(-1)),
              ts.notEqual(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            )
          ),
          [
            ts.statementEvaluateExpr(
              ts.callMethod(resultVar, "push", [byteVar])
            ),
            ts.statementReturn(resultVar),
          ]
        ),
        ts.statementEvaluateExpr(
          ts.callMethod(resultVar, "push", [
            ts.bitwiseOr(byteVar, ts.numberLiteral(0x80)),
          ])
        ),
      ]),
    ],
  };
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
const stringCode = (): ts.Function => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);

  const resultExpr: ts.Expr = ts.arrayLiteral([
    {
      expr: ts.callMethod(
        ts.newExpr(
          ts.conditionalOperator(
            ts.logicalOr(
              ts.equal(
                ts.globalObjects(identifer.fromString("process")),
                ts.undefinedLiteral
              ),
              ts.equal(
                ts.get(
                  ts.globalObjects(identifer.fromString("process")),
                  "title"
                ),
                ts.stringLiteral("browser")
              )
            ),
            ts.globalObjects(identifer.fromString("TextEncoder")),
            ts.importedVariable("util", identifer.fromString("TextEncoder"))
          ),
          []
        ),
        "encode",
        [ts.variable(identifer.fromString("text"))]
      ),
      spread: true,
    },
  ]);

  return {
    name: stringName,
    document: "stringからバイナリに変換する.",
    parameterList: [
      {
        name: identifer.fromString("text"),
        type_: ts.typeString,
        document: "",
      },
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: [
      ts.statementVariableDefinition(
        resultName,
        ts.readonlyArrayType(ts.typeNumber),
        resultExpr
      ),
      ts.statementReturn(
        ts.callMethod(
          encodeVarEval(type.typeInt32, ts.get(resultVar, "length")),
          "concat",
          [resultVar]
        )
      ),
    ],
  };
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
      document: "",
    },
  ],
  typeParameterList: [],
  returnType: readonlyArrayNumber,
  statementList: [
    ts.statementReturn(
      ts.arrayLiteral([
        {
          expr: ts.conditionalOperator(
            ts.variable(identifer.fromString("value")),
            ts.numberLiteral(1),
            ts.numberLiteral(0)
          ),
          spread: false,
        },
      ])
    ),
  ],
};

/* ========================================
                Binary
   ========================================
*/

const binaryName = identifer.fromString("encodeBinary");

const binaryCode = (): ts.Function => {
  const valueName = identifer.fromString("value");
  const valueVar = ts.variable(valueName);
  return {
    name: binaryName,
    document: "",
    parameterList: [
      {
        name: valueName,
        document: "",
        type_: ts.uint8ArrayType,
      },
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList: [
      ts.statementReturn(
        ts.callMethod(
          encodeVarEval(type.typeInt32, ts.get(valueVar, "length")),
          "concat",
          [ts.arrayLiteral([{ expr: valueVar, spread: true }])]
        )
      ),
    ],
  };
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
        document: "",
      },
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
              ),
            ]),
            ts.numberLiteral(16),
          ])
        ),
      ]),
      ts.statementReturn(resultVar),
    ],
  };
};

/* ========================================
                List
   ========================================
*/

const listName = identifer.fromString("encodeList");

const listCode = (): ts.Function => {
  const elementTypeName = identifer.fromString("T");
  const parameterListName = identifer.fromString("list");
  const parameterListVar = ts.variable(parameterListName);
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
        ),
      },
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
              name: parameterListName,
              type_: ts.readonlyArrayType(ts.typeScopeInFile(elementTypeName)),
            },
          ],
          readonlyArrayNumber,
          [
            ts.statementLetVariableDefinition(
              resultName,
              ts.arrayType(ts.typeNumber),
              ts.typeAssertion(
                encodeVarEval(
                  type.typeInt32,
                  ts.get(parameterListVar, "length")
                ),
                ts.arrayType(ts.typeNumber)
              )
            ),
            ts.statementForOf(elementName, parameterListVar, [
              ts.statementSet(
                ts.variable(resultName),
                null,
                ts.callMethod(ts.variable(resultName), "concat", [
                  ts.call(ts.variable(encodeFunctionName), [
                    ts.variable(elementName),
                  ]),
                ])
              ),
            ]),
            ts.statementReturn(ts.variable(resultName)),
          ]
        )
      ),
    ],
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
  const parameterMaybeName = identifer.fromString("maybe");
  const parameterMaybeVar = ts.variable(parameterMaybeName);

  return {
    name: maybeName,
    document: "",
    returnType: ts.typeFunction(
      [
        ts.typeWithParameter(
          ts.typeScopeInFile(identifer.fromString("Maybe")),
          [ts.typeScopeInFile(elementTypeName)]
        ),
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
        ),
      },
    ],
    typeParameterList: [elementTypeName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
          [
            {
              name: parameterMaybeName,
              type_: ts.typeWithParameter(
                ts.typeScopeInFile(identifer.fromString("Maybe")),
                [ts.typeScopeInFile(elementTypeName)]
              ),
            },
          ],
          readonlyArrayNumber,
          [
            ts.statementSwitch({
              expr: ts.get(parameterMaybeVar, "_"),
              patternList: [
                {
                  caseTag: "Just",
                  statementList: [
                    ts.statementReturn(
                      ts.callMethod(
                        ts.arrayLiteral([
                          { expr: ts.numberLiteral(0), spread: false },
                        ]),
                        "concat",
                        [
                          ts.call(encodeFunctionVar, [
                            ts.get(parameterMaybeVar, "value"),
                          ]),
                        ]
                      )
                    ),
                  ],
                },
                {
                  caseTag: "Nothing",
                  statementList: [
                    ts.statementReturn(
                      ts.arrayLiteral([
                        { expr: ts.numberLiteral(1), spread: false },
                      ])
                    ),
                  ],
                },
              ],
            }),
          ]
        )
      ),
    ],
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
        type_: ts.typeFunction([okTypeVar], readonlyArrayNumber),
      },
      {
        name: errorEncodeFunctionName,
        document: "",
        type_: ts.typeFunction([errorTypeVar], readonlyArrayNumber),
      },
    ],
    returnType: ts.typeFunction([resultType], readonlyArrayNumber),
    typeParameterList: [okName, errorName],
    statementList: [
      ts.statementReturn(
        ts.lambda(
          [
            {
              name: parameterResultName,
              type_: resultType,
            },
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
                        ts.arrayLiteral([
                          { expr: ts.numberLiteral(0), spread: false },
                        ]),
                        "concat",
                        [
                          ts.call(ts.variable(okEncodeFunctionName), [
                            ts.get(parameterResultVar, "ok"),
                          ]),
                        ]
                      )
                    ),
                  ],
                },
                {
                  caseTag: "Error",
                  statementList: [
                    ts.statementReturn(
                      ts.callMethod(
                        ts.arrayLiteral([
                          { expr: ts.numberLiteral(1), spread: false },
                        ]),
                        "concat",
                        [
                          ts.call(ts.variable(errorEncodeFunctionName), [
                            ts.get(parameterResultVar, "error"),
                          ]),
                        ]
                      )
                    ),
                  ],
                },
              ],
            }),
          ]
        )
      ),
    ],
  };
};

/* ========================================
                Custom
   ========================================
*/

const customName = (customTypeName: string): identifer.Identifer =>
  identifer.fromString("encode" + customTypeName);

export const customCode = (
  customType: type.CustomTypeDefinition
): ts.Function => {
  const parameterName = identifer.fromString("value");
  const parameterVar = ts.variable(parameterName);

  const statementList = ((): ReadonlyArray<ts.Statement> => {
    switch (customType.body._) {
      case "Product":
        return customProductCode(
          customType.body.memberNameAndTypeList,
          parameterVar
        );
      case "Sum":
        return customSumCode(
          customType.body.tagNameAndParameterList,
          parameterVar
        );
    }
  })();

  return {
    name: customName(customType.name),
    document: "",
    parameterList: [
      {
        name: parameterName,
        document: "",
        type_: ts.typeScopeInFile(identifer.fromString(customType.name)),
      },
    ],
    typeParameterList: [],
    returnType: readonlyArrayNumber,
    statementList,
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
      ),
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
        ),
      }),
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
      ),
    }),
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
          ts.arrayLiteral([{ expr: ts.numberLiteral(index), spread: false }]),
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
            ),
          ]
        );

      case "Nothing":
        return ts.arrayLiteral([
          { expr: ts.numberLiteral(index), spread: false },
        ]);
    }
  })();
  return {
    caseTag: tagNameAndParameter.name,
    statementList: [ts.statementReturn(returnExpr)],
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
    case "Binary":
      return ts.variable(binaryName);
    case "List":
      return ts.call(ts.variable(listName), [encodeFunctionExpr(type_.type_)]);
    case "Maybe":
      return ts.call(ts.variable(maybeName), [encodeFunctionExpr(type_.type_)]);
    case "Result":
      return ts.call(ts.variable(resultName), [
        encodeFunctionExpr(type_.resultType.ok),
        encodeFunctionExpr(type_.resultType.error),
      ]);
    case "Id":
      return ts.variable(encodeIdName);
    case "Token":
      return ts.variable(encodeTokenName);
    case "Custom":
      return ts.stringLiteral("wait custom type…");
    case "Parameter":
      return ts.stringLiteral("parameter not support");
  }
};
