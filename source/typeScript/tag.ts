import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): ReadonlyArray<ts.Definition> => {
  const customTypeAndDefaultTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
    typeDef.maybeCustomTypeDefinition,
    typeDef.resultCustomTypeDefinition,
    ...customTypeList,
  ];
  return customTypeAndDefaultTypeList.map(customTypeDefinitionToTagVariable);
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
): ts.Definition => {
  return ts.definitionVariable({
    name: identifer.fromString(customType.name),
    document: customType.description,
    type_: customTypeDefinitionToType(customType),
    expr: customTypeDefinitionToExpr(customType),
  });
};

const customTypeDefinitionToType = (
  customType: type.CustomTypeDefinition
): ts.Type => {
  switch (customType.body._) {
    case "Product":
      return ts.typeObject(
        new Map(customTypeToEncodeAndDecodeType(customType))
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
            .concat(customTypeToEncodeAndDecodeType(customType))
        )
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: type.CustomTypeDefinition
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.objectLiteral(customTypeToEncodeAndDecodeExpr(customType));

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
          .concat(customTypeToEncodeAndDecodeExpr(customType))
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

const customTypeToEncodeAndDecodeType = (
  customType: type.CustomTypeDefinition
): ReadonlyArray<
  [
    string,
    {
      type_: ts.Type;
      document: string;
    }
  ]
> => {
  const typeParameterAdIdentiferList = customType.typeParameterList.map(
    identifer.fromString
  );

  return [
    [
      "encode",
      {
        type_:
          typeParameterAdIdentiferList.length === 0
            ? encodeFunctionType(
                ts.typeScopeInFile(identifer.fromString(customType.name))
              )
            : ts.typeFunction(
                typeParameterAdIdentiferList,
                typeParameterAdIdentiferList.map((typeParameterAdIdentifer) =>
                  encodeFunctionType(
                    ts.typeScopeInFile(typeParameterAdIdentifer)
                  )
                ),
                encodeFunctionType(
                  ts.typeWithParameter(
                    ts.typeScopeInFile(identifer.fromString(customType.name)),
                    typeParameterAdIdentiferList.map(ts.typeScopeInFile)
                  )
                )
              ),
        document:
          customType.name + "を@narumincho/typeのバイナリ形式にエンコードする",
      },
    ],
    [
      "decode",
      {
        type_:
          typeParameterAdIdentiferList.length === 0
            ? decodeFunctionType(
                ts.typeScopeInFile(identifer.fromString(customType.name))
              )
            : ts.typeFunction(
                typeParameterAdIdentiferList,
                typeParameterAdIdentiferList.map((typeParameterAdIdentifer) =>
                  decodeFunctionType(
                    ts.typeScopeInFile(typeParameterAdIdentifer)
                  )
                ),
                decodeFunctionType(
                  ts.typeWithParameter(
                    ts.typeScopeInFile(identifer.fromString(customType.name)),
                    typeParameterAdIdentiferList.map(ts.typeScopeInFile)
                  )
                )
              ),
        document:
          "@narumincho/typeのバイナリ形式から" +
          customType.name +
          "にデコードする",
      },
    ],
  ];
};

const encodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction([], [type_], ts.readonlyArrayType(ts.typeNumber));

const decodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction(
    [],
    [ts.typeNumber, ts.uint8ArrayType],
    ts.typeObject(
      new Map([
        [
          "result",
          {
            type_: type_,
            document: "",
          },
        ],
        ["nextIndex", { type_: ts.typeNumber, document: "" }],
      ])
    )
  );

const customTypeToEncodeAndDecodeExpr = (
  customType: type.CustomTypeDefinition
): ReadonlyArray<ts.Member> => {
  return [
    ts.memberKeyValue("encode", encodeFunction(customType)),
    ts.memberKeyValue("decode", decodeFunction(customType)),
  ];
};

const encodeFunction = (
  customTypeDefinition: type.CustomTypeDefinition
): ts.Expr => {
  switch (customTypeDefinition.body._) {
    case "Product": {
      const inputParameterName = identifer.fromString("value");
      return ts.lambda(
        [
          {
            name: inputParameterName,
            type_: ts.typeScopeInFile(
              identifer.fromString(customTypeDefinition.name)
            ),
          },
        ],
        [],
        ts.readonlyArrayType(ts.typeNumber),
        productEncodeExpr(
          customTypeDefinition.body.memberNameAndTypeList,
          ts.variable(inputParameterName)
        )
      );
    }
    case "Sum":
      return ts.lambda([], [], ts.typeObject(new Map()), []);
  }
};

const productEncodeExpr = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  if (memberNameAndTypeArray.length === 0) {
    return [ts.statementReturn(ts.arrayLiteral([]))];
  }
  let e = ts.call(encodeExpr(memberNameAndTypeArray[0].memberType), [
    ts.get(parameter, memberNameAndTypeArray[0].name),
  ]);
  for (const memberNameAndType of memberNameAndTypeArray.slice(1)) {
    e = ts.callMethod(e, "concat", [
      ts.call(encodeExpr(memberNameAndType.memberType), [
        ts.get(parameter, memberNameAndType.name),
      ]),
    ]);
  }
  return [ts.statementReturn(e)];
};

const encodeExpr = (type_: type.Type): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return ts.stringLiteral("Int32をエンコードする関数");
    case "String":
      return ts.stringLiteral("Stringをエンコードする関数");
    case "Bool":
      return ts.stringLiteral("Boolをエンコードする関数");
    case "Binary":
      return ts.stringLiteral("binaryをエンコードする関数");
    case "List":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("List")), "encode"),
        [encodeExpr(type_.type_)]
      );
    case "Maybe":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("Maybe")), "encode"),
        [encodeExpr(type_.type_)]
      );
    case "Result":
      return ts.call(
        ts.get(ts.variable(identifer.fromString("Result")), "encode"),
        [encodeExpr(type_.resultType.ok), encodeExpr(type_.resultType.error)]
      );
    case "Id":
      return ts.get(ts.variable(identifer.fromString(type_.string_)), "encode");
    case "Token":
      return ts.get(ts.variable(identifer.fromString(type_.string_)), "encode");
    case "Custom":
      return ts.get(
        ts.variable(identifer.fromString(type_.customType.name)),
        "encode"
      );
    case "Parameter":
      return ts.stringLiteral("parameterどうすれば良いのだろう?");
  }
};

const decodeFunction = (
  customTypeDefinition: type.CustomTypeDefinition
): ts.Expr => {
  return ts.lambda(
    [],
    [],
    ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
    []
  );
};
