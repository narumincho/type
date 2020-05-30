import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "./type";
import * as util from "./util";
import * as c from "./case";
import * as typeDef from "./typeDefinition";
import * as int32 from "./kernel/int32";
import * as codec from "./kernel/codec";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idAndTokenNameSet: type.IdAndTokenNameSet,
  withKernel: boolean
): ReadonlyArray<ts.Variable> => {
  if (withKernel) {
    const customTypeAndDefaultTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
      typeDef.maybeCustomTypeDefinition,
      typeDef.resultCustomTypeDefinition,
      ...customTypeList,
    ];
    return [
      int32.exprDefinition(),
      string(),
      bool(),
      binary(),
      list(),
      ...[...idAndTokenNameSet.id].map(idVariable),
      ...[...idAndTokenNameSet.token].map(tokenVariable),
      ...customTypeAndDefaultTypeList.map((customTypeAndDefaultType) =>
        customTypeDefinitionToTagVariable(customTypeAndDefaultType, true)
      ),
    ];
  }
  return [
    ...[...idAndTokenNameSet.id].map(idVariable),
    ...[...idAndTokenNameSet.token].map(tokenVariable),
    ...customTypeList.map((customTypeAndDefaultType) =>
      customTypeDefinitionToTagVariable(customTypeAndDefaultType, false)
    ),
  ];
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
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Variable => {
  return {
    name: identifer.fromString(customType.name),
    document: customType.description,
    type_: customTypeDefinitionToType(customType, withKernel),
    expr: customTypeDefinitionToExpr(customType, withKernel),
  };
};

const customTypeDefinitionToType = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Type => {
  switch (customType.body._) {
    case "Product":
      return ts.typeObject(
        new Map([
          [
            util.codecPropertyName,
            {
              type_: customTypeToCodecType(customType, withKernel),
              document: "",
            },
          ],
        ])
      );
    case "Sum":
      return ts.typeObject(
        new Map(
          customType.body.patternList
            .map(
              (pattern) =>
                [
                  pattern.name,
                  {
                    type_: tagNameAndParameterToTagExprType(
                      identifer.fromString(customType.name),
                      customType.typeParameterList,
                      pattern
                    ),
                    document: pattern.description,
                  },
                ] as const
            )
            .concat([
              [
                util.codecPropertyName,
                {
                  type_: customTypeToCodecType(customType, withKernel),
                  document: "",
                },
              ] as const,
            ])
        )
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.objectLiteral(customTypeToCodecExpr(customType, withKernel));

    case "Sum": {
      const patternList = customType.body.patternList;
      return ts.objectLiteral(
        patternList
          .map((pattern) =>
            ts.memberKeyValue(
              pattern.name,
              type.isTagTypeAllNoParameter(patternList)
                ? ts.stringLiteral(pattern.name)
                : tagNameAndParameterToTagExpr(
                    identifer.fromString(customType.name),
                    customType.typeParameterList,
                    pattern
                  )
            )
          )
          .concat(customTypeToCodecExpr(customType, withKernel))
      );
    }
  }
};

const tagNameAndParameterToTagExprType = (
  typeName: identifer.Identifer,
  typeParameterList: ReadonlyArray<string>,
  pattern: type.Pattern
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

  switch (pattern.parameter._) {
    case "Just":
      return ts.typeFunction(
        typeParameterIdentiferList,
        [util.typeToTypeScriptType(pattern.parameter.value)],
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
  pattern: type.Pattern
): ts.Expr => {
  const tagField: ts.Member = ts.memberKeyValue(
    "_",
    ts.stringLiteral(pattern.name)
  );
  const returnType = ts.typeWithParameter(
    ts.typeScopeInFile(typeName),
    typeParameterList.map((typeParameter) =>
      ts.typeScopeInFile(identifer.fromString(typeParameter))
    )
  );

  switch (pattern.parameter._) {
    case "Just":
      return ts.lambda(
        [
          {
            name: util.typeToMemberOrParameterName(pattern.parameter.value),
            type_: util.typeToTypeScriptType(pattern.parameter.value),
          },
        ],
        typeParameterList.map(identifer.fromString),
        returnType,
        [
          ts.statementReturn(
            ts.objectLiteral([
              tagField,
              ts.memberKeyValue(
                util.typeToMemberOrParameterName(pattern.parameter.value),
                ts.variable(
                  util.typeToMemberOrParameterName(pattern.parameter.value)
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

/** カスタム型の式のcodecプロパティの型 */
const customTypeToCodecType = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Type =>
  codec.codecTypeWithTypeParameter(
    ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
    customTypeDefinition.typeParameterList,
    withKernel
  );

const customTypeToCodecExpr = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ReadonlyArray<ts.Member> => {
  return [
    ts.memberKeyValue(
      util.codecPropertyName,
      codecExpr(customType, withKernel)
    ),
  ];
};

const codecParameterName = (name: string): identifer.Identifer =>
  identifer.fromString(name + "Codec");

const codecExpr = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
  switch (customTypeDefinition.body._) {
    case "Product": {
      if (customTypeDefinition.typeParameterList.length === 0) {
        return ts.objectLiteral([
          ts.memberKeyValue(
            util.encodePropertyName,
            encodeExpr(customTypeDefinition, withKernel)
          ),
          ts.memberKeyValue(
            util.decodePropertyName,
            decodeExpr(customTypeDefinition, withKernel)
          ),
        ]);
      }
      return ts.lambda(
        customTypeDefinition.typeParameterList.map((typeParameter) => ({
          name: codecParameterName(typeParameter),
          type_: customTypeToCodecType(customTypeDefinition, withKernel),
        })),
        customTypeDefinition.typeParameterList.map(identifer.fromString),
        customTypeToCodecType(customTypeDefinition, withKernel),
        [
          ts.statementReturn(
            ts.objectLiteral([
              ts.memberKeyValue(
                util.encodePropertyName,
                encodeExpr(customTypeDefinition, withKernel)
              ),
              ts.memberKeyValue(
                util.decodePropertyName,
                decodeExpr(customTypeDefinition, withKernel)
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

const encodeExpr = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
  switch (customTypeDefinition.body._) {
    case "Product":
      return ts.lambda(
        [
          {
            name: identifer.fromString(customTypeDefinition.name),
            type_: ts.typeScopeInFile(
              identifer.fromString(customTypeDefinition.name)
            ),
          },
        ],
        [],
        ts.readonlyArrayType(ts.typeNumber),
        productEncodeExpr(
          customTypeDefinition.body.memberList,
          ts.variable(identifer.fromString(customTypeDefinition.name)),
          withKernel
        )
      );

    case "Sum":
      return ts.lambda(
        [
          {
            name: identifer.fromString(customTypeDefinition.name),
            type_: ts.typeScopeInFile(
              identifer.fromString(customTypeDefinition.name)
            ),
          },
        ],
        [],
        ts.readonlyArrayType(ts.typeNumber),
        []
      );
  }
};

const decodeExpr = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
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
            type_: ts.typeScopeInFile(
              identifer.fromString(customTypeDefinition.name)
            ),
          },
        ],
        ["nextIndex", { document: "", type_: ts.typeNumber }],
      ])
    ),
    []
  );
};

const productEncodeExpr = (
  memberList: ReadonlyArray<type.Member>,
  parameter: ts.Expr,
  withKernel: boolean
): ReadonlyArray<ts.Statement> => {
  if (memberList.length === 0) {
    return [ts.statementReturn(ts.arrayLiteral([]))];
  }
  let e = ts.call(
    ts.get(
      codecExprUse(memberList[0].type, withKernel),
      util.encodePropertyName
    ),
    [ts.get(parameter, memberList[0].name)]
  );
  for (const member of memberList.slice(1)) {
    e = ts.callMethod(e, "concat", [
      ts.call(
        ts.get(codecExprUse(member.type, withKernel), util.encodePropertyName),
        [ts.get(parameter, member.name)]
      ),
    ]);
  }
  return [ts.statementReturn(e)];
};

const codecExprUse = (type_: type.Type, withKernel: boolean): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return int32.codec(withKernel);
    case "String":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("String"))
          : ts.importedVariable(
              util.moduleName,
              identifer.fromString("String")
            ),
        util.codecPropertyName
      );
    case "Bool":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("Bool"))
          : ts.importedVariable(util.moduleName, identifer.fromString("Bool")),
        util.codecPropertyName
      );
    case "Binary":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("Binary"))
          : ts.importedVariable(
              util.moduleName,
              identifer.fromString("Binary")
            ),
        util.codecPropertyName
      );
    case "List":
      return ts.call(
        ts.get(
          withKernel
            ? ts.variable(identifer.fromString("List"))
            : ts.importedVariable(
                util.moduleName,
                identifer.fromString("List")
              ),
          util.codecPropertyName
        ),
        [codecExprUse(type_.type_, withKernel)]
      );
    case "Maybe":
      return ts.call(
        ts.get(
          withKernel
            ? ts.variable(identifer.fromString("Maybe"))
            : ts.importedVariable(
                util.moduleName,
                identifer.fromString("Maybe")
              ),
          util.codecPropertyName
        ),
        [codecExprUse(type_.type_, withKernel)]
      );
    case "Result":
      return ts.call(
        ts.get(
          withKernel
            ? ts.variable(identifer.fromString("Result"))
            : ts.importedVariable(
                util.moduleName,
                identifer.fromString("Result")
              ),
          util.codecPropertyName
        ),
        [
          codecExprUse(type_.okAndErrorType.ok, withKernel),
          codecExprUse(type_.okAndErrorType.error, withKernel),
        ]
      );
    case "Id":
      return ts.get(
        ts.variable(identifer.fromString(type_.string_)),
        util.codecPropertyName
      );
    case "Token":
      return ts.get(
        ts.variable(identifer.fromString(type_.string_)),
        util.codecPropertyName
      );
    case "Custom":
      return ts.get(
        ts.variable(identifer.fromString(type_.nameAndTypeParameterList.name)),
        util.codecPropertyName
      );
    case "Parameter":
      return ts.variable(codecParameterName(type_.string_));
  }
};
