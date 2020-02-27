import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as type from "../../type";
import * as typeScript from "../../typeScript";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>,
  isBrowser: boolean
): ReadonlyMap<string, generator.ExportFunction> => {
  const needEncodeTypeList = type.customTypeDictionaryCollectType(
    customTypeDictionary
  );
  let typeEncoderList: ReadonlyArray<[string, generator.ExportFunction]> = [];
  for (const uniqueNeedEncodeType of needEncodeTypeList) {
    typeEncoderList = typeEncoderList.concat(
      encodeCode(uniqueNeedEncodeType, isBrowser)
    );
  }

  return new Map(
    [...customTypeDictionary]
      .map(([name, customType]) => customCode(name, customType))
      .concat(typeEncoderList)
  );
};

/**
 * `ReadonlyArray<number>`
 * を表現する
 */
const readonlyArrayNumber: typeExpr.TypeExpr = typeExpr.readonlyArrayType(
  typeExpr.typeNumber
);

export const encodeVarEval = (type_: type.Type, data: expr.Expr): expr.Expr =>
  expr.call(expr.globalVariable(encodeName(type_)), [data]);

const encodeName = (type_: type.Type): string => {
  return "encode" + type.toTypeName(type_);
};

/* ========================================
                  UInt32
   ========================================
*/

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 */
const uInt32Code: generator.ExportFunction = {
  document:
    "numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード",
  parameterList: [{ name: "num", typeExpr: typeExpr.typeNumber, document: "" }],
  returnType: readonlyArrayNumber,
  statementList: [
    expr.set(
      expr.localVariable(["num"]),
      null,
      expr.callMathMethod("floor", [
        expr.callMathMethod("max", [
          expr.numberLiteral(0),
          expr.callMathMethod("min", [
            expr.localVariable(["num"]),
            expr.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    expr.variableDefinition(
      ["numberArray"],
      typeExpr.arrayType(typeExpr.typeNumber),
      expr.arrayLiteral([])
    ),
    expr.whileTrue([
      expr.variableDefinition(
        ["b"],
        typeExpr.typeNumber,
        expr.bitwiseAnd(
          expr.localVariable(["num"]),
          expr.numberLiteral(0b1111111)
        )
      ),
      expr.set(
        expr.localVariable(["num"]),
        null,
        expr.unsignedRightShift(
          expr.localVariable(["num"]),
          expr.numberLiteral(7)
        )
      ),
      expr.ifStatement(
        expr.equal(expr.localVariable(["num"]), expr.numberLiteral(0)),
        [
          expr.evaluateExpr(
            expr.callMethod(expr.localVariable(["numberArray"]), "push", [
              expr.localVariable(["b"])
            ])
          ),
          expr.returnStatement(expr.localVariable(["numberArray"]))
        ]
      ),
      expr.evaluateExpr(
        expr.callMethod(expr.localVariable(["numberArray"]), "push", [
          expr.bitwiseOr(
            expr.localVariable(["b"]),
            expr.numberLiteral(0b10000000)
          )
        ])
      )
    ])
  ]
};

/* ========================================
                  String
   ========================================
*/

/**
 * stringからバイナリに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
const stringCode = (isBrowser: boolean): generator.ExportFunction => ({
  document:
    "stringからバイナリに変換するコード. このコードは" +
    (isBrowser
      ? "ブラウザ用なのでグローバルのTextDecoderを使う"
      : "Node.js用なのでutilのTextDecoderを使う"),
  parameterList: [
    { name: "text", typeExpr: typeExpr.typeString, document: "" }
  ],
  returnType: readonlyArrayNumber,
  statementList: [
    expr.returnStatement(
      expr.callMethod(expr.globalVariable("Array"), "from", [
        expr.callMethod(
          expr.newExpr(
            isBrowser
              ? expr.globalVariable("TextEncoder")
              : expr.importedVariable("util", "TextEncoder"),
            []
          ),
          "encode",
          [expr.localVariable(["text"])]
        )
      ])
    )
  ]
});

/* ========================================
            HexString (Id / Hash)
   ========================================
*/

const encodeHexString = (byteSize: number): generator.ExportFunction => ({
  document: "",
  parameterList: [{ name: "id", typeExpr: typeExpr.typeString, document: "" }],
  returnType: readonlyArrayNumber,
  statementList: [
    expr.variableDefinition(
      ["result"],
      typeExpr.arrayType(typeExpr.typeNumber),
      expr.arrayLiteral([])
    ),
    expr.forStatement(["i"], expr.numberLiteral(byteSize), [
      expr.set(
        expr.getByExpr(
          expr.localVariable(["result"]),
          expr.localVariable(["i"])
        ),
        null,
        expr.callNumberMethod("parseInt", [
          expr.callMethod(expr.localVariable(["id"]), "slice", [
            expr.multiplication(
              expr.localVariable(["i"]),
              expr.numberLiteral(2)
            ),
            expr.addition(
              expr.multiplication(
                expr.localVariable(["i"]),
                expr.numberLiteral(2)
              ),
              expr.numberLiteral(2)
            )
          ]),
          expr.numberLiteral(16)
        ])
      )
    ])
  ]
});

/* ========================================
                List
   ========================================
*/

const listCode = (type_: type.Type): generator.ExportFunction => ({
  document: "",
  parameterList: [
    {
      name: "list",
      document: "",
      typeExpr: typeScript.typeToGeneratorType(type_)
    }
  ],
  returnType: readonlyArrayNumber,
  statementList: [
    expr.letVariableDefinition(
      ["result"],
      typeExpr.arrayType(typeExpr.typeNumber),
      expr.arrayLiteral([])
    ),
    expr.set(
      expr.localVariable(["result"]),
      null,
      expr.callMethod(expr.localVariable(["result"]), "concat", [
        encodeVarEval(
          type.typeUInt32,
          expr.get(expr.localVariable(["list"]), "length")
        )
      ])
    ),
    expr.forOfStatement(["element"], expr.localVariable(["list"]), [
      expr.set(
        expr.localVariable(["result"]),
        null,
        expr.callMethod(expr.localVariable(["result"]), "concat", [
          encodeVarEval(type_, expr.localVariable(["element"]))
        ])
      )
    ]),
    expr.returnStatement(expr.localVariable(["result"]))
  ]
});

export const encodeCode = (
  type_: type.Type,
  isBrowser: boolean
): ReadonlyArray<[string, generator.ExportFunction]> => {
  const name = encodeName(type_);
  switch (type_._) {
    case type.Type_.UInt32:
      return [[name, uInt32Code]];

    case type.Type_.String:
      return [[name, stringCode(isBrowser)]];

    case type.Type_.Id:
      return [[name, encodeHexString(16)]];

    case type.Type_.Hash:
      return [[name, encodeHexString(32)]];

    case type.Type_.List:
      return [
        [name, listCode(type_.type_)] as [string, generator.ExportFunction]
      ].concat(encodeCode(type_.type_, isBrowser));

    case type.Type_.Custom:
      return [];
  }
};

/* ========================================
                Custom
   ========================================
*/

export const customCode = (
  customTypeName: string,
  customType: type.CustomType
): [string, generator.ExportFunction] => {
  const parameterName = typeScript.typeToMemberOrParameterName(
    type.typeCustom(customTypeName)
  );

  const returnExpr = ((): ReadonlyArray<generator.expr.Statement> => {
    switch (customType.body._) {
      case type.CustomType_.Product:
        return customProductCode(
          customType.body.memberNameAndTypeArray,
          (memberName: string) =>
            expr.get(expr.localVariable([parameterName]), memberName)
        );
      case type.CustomType_.Sum:
        return customSumCode(
          customTypeName,
          customType.body.tagNameAndParameterArray,
          (memberName: string) =>
            expr.get(expr.localVariable([parameterName]), memberName)
        );
    }
  })();

  return [
    encodeName(type.typeCustom(customTypeName)),
    {
      document: "",
      parameterList: [
        {
          name: parameterName,
          document: "",
          typeExpr: typeScript.typeToGeneratorType(
            type.typeCustom(customTypeName)
          )
        }
      ],
      returnType: readonlyArrayNumber,
      statementList: returnExpr
    }
  ];
};

export const customProductCode = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  get: (memberName: string) => expr.Expr
): ReadonlyArray<generator.expr.Statement> => {
  let e = encodeVarEval(
    memberNameAndTypeArray[0].memberType,
    get(memberNameAndTypeArray[0].name)
  );
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = expr.callMethod(e, "concat", [
      encodeVarEval(memberNameAndType.memberType, get(memberNameAndType.name))
    ]);
  }
  return [expr.returnStatement(e)];
};

export const customSumCode = (
  customTypeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  get: (memberName: string) => expr.Expr
): ReadonlyArray<generator.expr.Statement> => {
  const statementList: Array<generator.expr.Statement> = [
    expr.letVariableDefinition(
      ["result"],
      typeExpr.arrayType(typeExpr.typeNumber),
      expr.arrayLiteral([])
    ),
    expr.set(
      expr.localVariable(["result"]),
      null,
      expr.callMethod(expr.localVariable(["result"]), "concat", [
        encodeVarEval(type.typeUInt32, get("_"))
      ])
    )
  ];
  for (const [
    index,
    tagNameAndParameter
  ] of tagNameAndParameterArray.entries()) {
    switch (tagNameAndParameter.parameter._) {
      case type.TagParameter_.Just:
        statementList.push(
          expr.ifStatement(
            expr.equal(
              get("_"),
              expr.enumTag(
                typeScript.customTypeNameToEnumName(customTypeName),
                typeScript.tagNameToEnumTag(tagNameAndParameter.name)
              )
            ),
            [
              expr.returnStatement(
                expr.callMethod(expr.localVariable(["result"]), "concat", [
                  encodeVarEval(
                    tagNameAndParameter.parameter.type_,
                    get(
                      typeScript.typeToMemberOrParameterName(
                        tagNameAndParameter.parameter.type_
                      )
                    )
                  )
                ])
              )
            ]
          )
        );
    }
  }
  return statementList.concat([
    expr.throwError(
      expr.addition(
        expr.stringLiteral(customTypeName + " type tag index error. index = "),
        expr.callMethod(get("_"), "toString", [])
      )
    )
  ]);
};
