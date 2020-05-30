import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

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
      int32(),
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
            codecPropertyName,
            {
              type_: codecType(customType, withKernel),
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
                codecPropertyName,
                { type_: codecType(customType, withKernel), document: "" },
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

const codecType = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Type => {
  return customType.typeParameterList.length === 0
    ? typeDef.codecType(
        ts.typeScopeInFile(identifer.fromString(customType.name)),
        withKernel
      )
    : ts.typeFunction(
        customType.typeParameterList.map(identifer.fromString),
        customType.typeParameterList.map((typeParameter) =>
          typeDef.codecType(
            ts.typeScopeInFile(identifer.fromString(typeParameter)),
            withKernel
          )
        ),
        typeDef.codecType(
          ts.typeWithParameter(
            ts.typeScopeInFile(identifer.fromString(customType.name)),
            customType.typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          ),
          withKernel
        )
      );
};

const codecPropertyName = "codec";
const encodePropertyName = "encode";
const decodePropertyName = "decode";

const customTypeToCodecExpr = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ReadonlyArray<ts.Member> => {
  return [
    ts.memberKeyValue(codecPropertyName, codecExpr(customType, withKernel)),
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
            encodePropertyName,
            encodeExpr(customTypeDefinition, withKernel)
          ),
          ts.memberKeyValue(
            decodePropertyName,
            decodeExpr(customTypeDefinition, withKernel)
          ),
        ]);
      }
      return ts.lambda(
        customTypeDefinition.typeParameterList.map((typeParameter) => ({
          name: codecParameterName(typeParameter),
          type_: typeDef.codecType(
            ts.typeScopeInFile(identifer.fromString(typeParameter)),
            withKernel
          ),
        })),
        customTypeDefinition.typeParameterList.map(identifer.fromString),
        typeDef.codecType(
          ts.typeWithParameter(
            ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
            customTypeDefinition.typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          ),
          withKernel
        ),
        [
          ts.statementReturn(
            ts.objectLiteral([
              ts.memberKeyValue(
                encodePropertyName,
                encodeExpr(customTypeDefinition, withKernel)
              ),
              ts.memberKeyValue(
                decodePropertyName,
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
    ts.get(codecExprUse(memberList[0].type, withKernel), encodePropertyName),
    [ts.get(parameter, memberList[0].name)]
  );
  for (const member of memberList.slice(1)) {
    e = ts.callMethod(e, "concat", [
      ts.call(
        ts.get(codecExprUse(member.type, withKernel), encodePropertyName),
        [ts.get(parameter, member.name)]
      ),
    ]);
  }
  return [ts.statementReturn(e)];
};

const codecExprUse = (type_: type.Type, withKernel: boolean): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("Int32"))
          : ts.importedVariable(util.moduleName, identifer.fromString("Int32")),
        codecPropertyName
      );
    case "String":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("String"))
          : ts.importedVariable(
              util.moduleName,
              identifer.fromString("String")
            ),
        codecPropertyName
      );
    case "Bool":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("Bool"))
          : ts.importedVariable(util.moduleName, identifer.fromString("Bool")),
        codecPropertyName
      );
    case "Binary":
      return ts.get(
        withKernel
          ? ts.variable(identifer.fromString("Binary"))
          : ts.importedVariable(
              util.moduleName,
              identifer.fromString("Binary")
            ),
        codecPropertyName
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
          codecPropertyName
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
          codecPropertyName
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
          codecPropertyName
        ),
        [
          codecExprUse(type_.okAndErrorType.ok, withKernel),
          codecExprUse(type_.okAndErrorType.error, withKernel),
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
        ts.variable(identifer.fromString(type_.nameAndTypeParameterList.name)),
        codecPropertyName
      );
    case "Parameter":
      return ts.variable(codecParameterName(type_.string_));
  }
};
