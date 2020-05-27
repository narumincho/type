import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idAndTokenNameSet: type.IdAndTokenNameSet
): ReadonlyArray<ts.Variable> => {
  const customTypeAndDefaultTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
    typeDef.maybeCustomTypeDefinition,
    typeDef.resultCustomTypeDefinition,
    ...customTypeList,
  ];
  return [
    int32(),
    string(),
    bool(),
    binary(),
    list(),
    ...[...idAndTokenNameSet.id].map(idVariable),
    ...[...idAndTokenNameSet.token].map(tokenVariable),
    ...customTypeAndDefaultTypeList.map(customTypeDefinitionToTagVariable),
  ];
};

const int32 = (): ts.Variable => {
  return {
    name: identifer.fromString("Int32"),
    document:
      "-2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const string = (): ts.Variable => {
  return {
    name: identifer.fromString("String"),
    document: "文字列. JavaScriptのstringで扱う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const bool = (): ts.Variable => {
  return {
    name: identifer.fromString("Bool"),
    document: "Bool. 真か偽. JavaScriptのbooleanで扱う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const binary = (): ts.Variable => {
  return {
    name: identifer.fromString("Binary"),
    document: "バイナリ. JavaScriptのUint8Arrayで扱う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const list = (): ts.Variable => {
  return {
    name: identifer.fromString("List"),
    document: "リスト. JavaScriptのArrayで扱う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const idVariable = (name: string): ts.Variable => {
  return {
    name: identifer.fromString(name),
    document: name + ". ものを識別するのに使う",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

const tokenVariable = (name: string): ts.Variable => {
  return {
    name: identifer.fromString(name),
    document: name + ". ものを識別したり,あるものであるのを証明したりする",
    type_: ts.typeObject(new Map()),
    expr: ts.objectLiteral([]),
  };
};

/* ========================================
                  Custom
   ========================================
*/
const customTypeNameIdentifer = (
  customTypeName: string,
  tagName: string
): identifer.Identifer => {
  return identifer.fromString(
    c.firstLowerCase(customTypeName) + c.firstUpperCase(tagName)
  );
};

export const customTypeVar = (
  customTypeName: string,
  tagName: string
): ts.Expr => ts.variable(customTypeNameIdentifer(customTypeName, tagName));

const customTypeDefinitionToTagVariable = (
  customType: type.CustomTypeDefinition
): ts.Variable => {
  return {
    name: identifer.fromString(customType.name),
    document: customType.description,
    type_: customTypeDefinitionToType(customType),
    expr: customTypeDefinitionToExpr(customType),
  };
};

const customTypeDefinitionToType = (
  customType: type.CustomTypeDefinition
): ts.Type => {
  switch (customType.body._) {
    case "Product":
      return ts.typeObject(
        new Map([
          [
            codecPropertyName,
            {
              type_: codecType(customType),
              document: "",
            },
          ],
        ])
      );
    case "Sum":
      return ts.typeObject(
        new Map(
          customType.body.tagNameAndParameterList
            .map(
              (tagNameAndParameter) =>
                [
                  tagNameAndParameter.name,
                  {
                    type_: tagNameAndParameterToTagExprType(
                      identifer.fromString(customType.name),
                      customType.typeParameterList,
                      tagNameAndParameter
                    ),
                    document: tagNameAndParameter.description,
                  },
                ] as const
            )
            .concat([
              [
                codecPropertyName,
                { type_: codecType(customType), document: "" },
              ] as const,
            ])
        )
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: type.CustomTypeDefinition
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.objectLiteral(customTypeToCodecExpr(customType));

    case "Sum": {
      const tagNameAndParameterList = customType.body.tagNameAndParameterList;
      return ts.objectLiteral(
        tagNameAndParameterList
          .map((tagNameAndParameter) =>
            ts.memberKeyValue(
              tagNameAndParameter.name,
              type.isTagTypeAllNoParameter(tagNameAndParameterList)
                ? ts.stringLiteral(tagNameAndParameter.name)
                : tagNameAndParameterToTagExpr(
                    identifer.fromString(customType.name),
                    customType.typeParameterList,
                    tagNameAndParameter
                  )
            )
          )
          .concat(customTypeToCodecExpr(customType))
      );
    }
  }
};

const tagNameAndParameterToTagExprType = (
  typeName: identifer.Identifer,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameter: type.TagNameAndParameter
) => {
  const typeParameterIdentiferList = typeParameterList.map(
    identifer.fromString
  );
  const returnType = ts.typeWithParameter(
    ts.typeScopeInFile(typeName),
    typeParameterIdentiferList.map((typeParameterIdentifer) =>
      ts.typeScopeInFile(typeParameterIdentifer)
    )
  );

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.typeFunction(
        typeParameterIdentiferList,
        [util.typeToTypeScriptType(tagNameAndParameter.parameter.value)],
        returnType
      );

    case "Nothing":
      {
        if (typeParameterList.length === 0) {
          return returnType;
        }
      }
      return ts.typeFunction(typeParameterIdentiferList, [], returnType);
  }
};

const tagNameAndParameterToTagExpr = (
  typeName: identifer.Identifer,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameter: type.TagNameAndParameter
): ts.Expr => {
  const tagField: ts.Member = ts.memberKeyValue(
    "_",
    ts.stringLiteral(tagNameAndParameter.name)
  );
  const returnType = ts.typeWithParameter(
    ts.typeScopeInFile(typeName),
    typeParameterList.map((typeParameter) =>
      ts.typeScopeInFile(identifer.fromString(typeParameter))
    )
  );

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.lambda(
        [
          {
            name: util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            type_: util.typeToTypeScriptType(
              tagNameAndParameter.parameter.value
            ),
          },
        ],
        typeParameterList.map(identifer.fromString),
        returnType,
        [
          ts.statementReturn(
            ts.objectLiteral([
              tagField,
              ts.memberKeyValue(
                util.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.value
                ),
                ts.variable(
                  util.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  )
                )
              ),
            ])
          ),
        ]
      );

    case "Nothing":
      if (typeParameterList.length === 0) {
        return ts.objectLiteral([tagField]);
      }
      return ts.lambda(
        [],
        typeParameterList.map(identifer.fromString),
        returnType,
        [ts.statementReturn(ts.objectLiteral([tagField]))]
      );
  }
};

const codecType = (customType: type.CustomTypeDefinition): ts.Type => {
  return customType.typeParameterList.length === 0
    ? typeDef.codecType(
        ts.typeScopeInFile(identifer.fromString(customType.name))
      )
    : ts.typeFunction(
        customType.typeParameterList.map(identifer.fromString),
        customType.typeParameterList.map((typeParameter) =>
          typeDef.codecType(
            ts.typeScopeInFile(identifer.fromString(typeParameter))
          )
        ),
        typeDef.codecType(
          ts.typeWithParameter(
            ts.typeScopeInFile(identifer.fromString(customType.name)),
            customType.typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          )
        )
      );
};

const codecPropertyName = "codec";
const encodePropertyName = "encode";
const decodePropertyName = "decode";

const customTypeToCodecExpr = (
  customType: type.CustomTypeDefinition
): ReadonlyArray<ts.Member> => {
  return [ts.memberKeyValue(codecPropertyName, codecExpr(customType))];
};

const codecParameterName = (name: string): identifer.Identifer =>
  identifer.fromString(name + "Codec");

const codecExpr = (
  customTypeDefinition: type.CustomTypeDefinition
): ts.Expr => {
  switch (customTypeDefinition.body._) {
    case "Product": {
      if (customTypeDefinition.typeParameterList.length === 0) {
        return ts.objectLiteral([
          ts.memberKeyValue(
            encodePropertyName,
            encodeExpr(customTypeDefinition.name)
          ),
          ts.memberKeyValue(
            decodePropertyName,
            decodeExpr(customTypeDefinition.name)
          ),
        ]);
      }
      return ts.lambda(
        customTypeDefinition.typeParameterList.map((typeParameter) => ({
          name: codecParameterName(typeParameter),
          type_: typeDef.codecType(
            ts.typeScopeInFile(identifer.fromString(typeParameter))
          ),
        })),
        customTypeDefinition.typeParameterList.map(identifer.fromString),
        typeDef.codecType(
          ts.typeWithParameter(
            ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
            customTypeDefinition.typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          )
        ),
        [
          ts.statementReturn(
            ts.objectLiteral([
              ts.memberKeyValue(
                encodePropertyName,
                encodeExpr(customTypeDefinition.name)
              ),
              ts.memberKeyValue(
                decodePropertyName,
                decodeExpr(customTypeDefinition.name)
              ),
            ])
          ),
        ]
      );
    }
    case "Sum":
      return ts.lambda([], [], ts.typeObject(new Map()), []);
  }
};

const encodeExpr = (typeName: string): ts.Expr => {
  return ts.lambda(
    [
      {
        name: identifer.fromString(typeName),
        type_: ts.typeScopeInFile(identifer.fromString(typeName)),
      },
    ],
    [],
    ts.readonlyArrayType(ts.typeNumber),
    []
  );
};

const decodeExpr = (typeName: string): ts.Expr => {
  return ts.lambda(
    [
      {
        name: identifer.fromString("index"),
        type_: ts.typeNumber,
      },
      {
        name: identifer.fromString("binary"),
        type_: ts.uint8ArrayType,
      },
    ],
    [],
    ts.typeObject(
      new Map([
        [
          "result",
          {
            document: "",
            type_: ts.typeScopeInFile(identifer.fromString(typeName)),
          },
        ],
        ["nextIndex", { document: "", type_: ts.typeNumber }],
      ])
    ),
    []
  );
};

const productCodecExpr = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  if (memberNameAndTypeArray.length === 0) {
    return [ts.statementReturn(ts.arrayLiteral([]))];
  }
  let e = ts.call(codecExprUse(memberNameAndTypeArray[0].memberType), [
    ts.get(parameter, memberNameAndTypeArray[0].name),
  ]);
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = ts.callMethod(e, "concat", [
      ts.call(codecExprUse(memberNameAndType.memberType), [
        ts.get(parameter, memberNameAndType.name),
      ]),
    ]);
  }
  return [ts.statementReturn(e)];
};

const codecExprUse = (type_: type.Type): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return ts.get(
        ts.variable(identifer.fromString("Int32")),
        codecPropertyName
      );
    case "String":
      return ts.get(
        ts.variable(identifer.fromString("String")),
        codecPropertyName
      );
    case "Bool":
      return ts.get(
        ts.variable(identifer.fromString("Bool")),
        codecPropertyName
      );
    case "Binary":
      return ts.get(
        ts.variable(identifer.fromString("Binary")),
        codecPropertyName
      );
    case "List":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("List")), codecPropertyName),
        [codecExprUse(type_.type_)]
      );
    case "Maybe":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("Maybe")), codecPropertyName),
        [codecExprUse(type_.type_)]
      );
    case "Result":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("Result")), codecPropertyName),
        [
          codecExprUse(type_.resultType.ok),
          codecExprUse(type_.resultType.error),
        ]
      );
    case "Id":
      return ts.get(
        ts.variable(identifer.fromString(type_.string_)),
        codecPropertyName
      );
    case "Token":
      return ts.get(
        ts.variable(identifer.fromString(type_.string_)),
        codecPropertyName
      );
    case "Custom":
      return ts.get(
        ts.variable(identifer.fromString(type_.customType.name)),
        "encode"
      );
    case "Parameter":
      return ts.variable(codecParameterName(type_.string_));
  }
};
