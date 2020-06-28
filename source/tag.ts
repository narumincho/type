import * as binary from "./kernel/binary";
import * as bool from "./kernel/bool";
import * as codec from "./kernel/codec";
import * as data from "./data";
import * as hexString from "./kernel/hexString";
import * as int32 from "./kernel/int32";
import * as kernelString from "./kernel/string";
import * as list from "./kernel/list";
import * as maybe from "./kernel/maybe";
import * as result from "./kernel/result";
import * as url from "./kernel/url";
import * as util from "./util";
import { identifer, data as ts } from "js-ts-code-generator";

export const generate = (
  customTypeList: ReadonlyArray<data.CustomTypeDefinition>,
  idAndTokenNameSet: util.IdAndTokenNameSet
): ReadonlyArray<ts.Variable> => {
  const customTypeAndDefaultTypeList: ReadonlyArray<data.CustomTypeDefinition> = [
    maybe.customTypeDefinition,
    result.customTypeDefinition,
    ...customTypeList,
  ];
  return [
    int32.variableDefinition(),
    kernelString.exprDefinition(),
    bool.variableDefinition(),
    binary.variableDefinition(),
    list.variableDefinition(),
    hexString.idKernelExprDefinition,
    hexString.tokenKernelExprDefinition,
    url.variableDefinition(),
    ...[...idAndTokenNameSet.id].map((name) =>
      hexString.idVariableDefinition(name)
    ),
    ...[...idAndTokenNameSet.token].map((name) =>
      hexString.tokenVariableDefinition(name)
    ),
    ...customTypeAndDefaultTypeList.map((customTypeAndDefaultType) =>
      customTypeDefinitionToTagVariable(customTypeAndDefaultType)
    ),
  ];
};

/*
 * ========================================
 *                Custom
 * ========================================
 */
const customTypeNameIdentifer = (
  customTypeName: string,
  tagName: string
): identifer.Identifer => {
  return identifer.fromString(
    util.firstLowerCase(customTypeName) + util.firstUpperCase(tagName)
  );
};

export const customTypeVar = (
  customTypeName: string,
  tagName: string
): ts.Expr => ts.variable(customTypeNameIdentifer(customTypeName, tagName));

const customTypeDefinitionToTagVariable = (
  customType: data.CustomTypeDefinition
): ts.Variable => {
  return {
    name: identifer.fromString(customType.name),
    document: customType.description,
    type: customTypeDefinitionToType(customType),
    expr: customTypeDefinitionToExpr(customType),
  };
};

const customTypeDefinitionToType = (
  customType: data.CustomTypeDefinition
): ts.Type => {
  switch (customType.body._) {
    case "Product":
      return ts.typeObject(
        new Map([
          [
            util.codecPropertyName,
            {
              type: customTypeToCodecType(customType),
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
                    type: tagNameAndParameterToTagExprType(
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
                  type: customTypeToCodecType(customType),
                  document: "",
                },
              ] as const,
            ])
        )
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: data.CustomTypeDefinition
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.objectLiteral(customTypeToCodecDefinitionMember(customType));

    case "Sum": {
      const { patternList } = customType.body;
      return ts.objectLiteral(
        patternList
          .map((pattern) =>
            ts.memberKeyValue(
              pattern.name,
              util.isTagTypeAllNoParameter(patternList)
                ? ts.stringLiteral(pattern.name)
                : patternToTagExpr(
                    identifer.fromString(customType.name),
                    customType.typeParameterList,
                    pattern
                  )
            )
          )
          .concat(customTypeToCodecDefinitionMember(customType))
      );
    }
  }
};

const tagNameAndParameterToTagExprType = (
  typeName: identifer.Identifer,
  typeParameterList: ReadonlyArray<string>,
  pattern: data.Pattern
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
      if (typeParameterList.length === 0) {
        return returnType;
      }
      return ts.typeFunction(typeParameterIdentiferList, [], returnType);
  }
};

const patternToTagExpr = (
  typeName: identifer.Identifer,
  typeParameterList: ReadonlyArray<string>,
  pattern: data.Pattern
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
    case "Just": {
      const parameterIdentifer = identifer.fromString(
        util.typeToMemberOrParameterName(pattern.parameter.value)
      );
      return ts.lambda(
        [
          {
            name: parameterIdentifer,
            type: util.typeToTypeScriptType(pattern.parameter.value),
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
                ts.variable(parameterIdentifer)
              ),
            ])
          ),
        ]
      );
    }

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
  customTypeDefinition: data.CustomTypeDefinition
): ts.Type =>
  codec.codecTypeWithTypeParameter(
    ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
    customTypeDefinition.typeParameterList
  );

const customTypeToCodecDefinitionMember = (
  customType: data.CustomTypeDefinition
): ReadonlyArray<ts.Member> => {
  return [
    ts.memberKeyValue(util.codecPropertyName, codecExprDefinition(customType)),
  ];
};

const codecParameterName = (name: string): identifer.Identifer =>
  identifer.fromString(name + "Codec");

const codecExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  if (customTypeDefinition.typeParameterList.length === 0) {
    return codecDefinitionBodyExpr(customTypeDefinition);
  }
  return ts.lambda(
    customTypeDefinition.typeParameterList.map((typeParameter) => ({
      name: codecParameterName(typeParameter),
      type: codec.codecType(
        ts.typeScopeInFile(identifer.fromString(typeParameter))
      ),
    })),
    customTypeDefinition.typeParameterList.map(identifer.fromString),
    codec.codecType(
      ts.typeWithParameter(
        ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
        customTypeDefinition.typeParameterList.map((typeParameter) =>
          ts.typeScopeInFile(identifer.fromString(typeParameter))
        )
      )
    ),
    [ts.statementReturn(codecDefinitionBodyExpr(customTypeDefinition))]
  );
};

const codecDefinitionBodyExpr = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  return ts.objectLiteral([
    ts.memberKeyValue(
      util.encodePropertyName,
      encodeExprDefinition(customTypeDefinition)
    ),
    ts.memberKeyValue(
      util.decodePropertyName,
      decodeExprDefinition(customTypeDefinition)
    ),
  ]);
};

/**
 * Encode Definition
 */
const encodeExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr =>
  codec.encodeLambda(
    ts.typeWithParameter(
      ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
      customTypeDefinition.typeParameterList.map((typeParameter) =>
        ts.typeScopeInFile(identifer.fromString(typeParameter))
      )
    ),
    (valueVar) => {
      switch (customTypeDefinition.body._) {
        case "Product":
          return productEncodeDefinitionStatementList(
            customTypeDefinition.body.memberList,
            valueVar
          );
        case "Sum":
          return sumEncodeDefinitionStatementList(
            customTypeDefinition.body.patternList,
            valueVar
          );
      }
    }
  );

const productEncodeDefinitionStatementList = (
  memberList: ReadonlyArray<data.Member>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  if (memberList.length === 0) {
    return [ts.statementReturn(ts.arrayLiteral([]))];
  }
  let e = ts.call(
    ts.get(codecExprUse(memberList[0].type), util.encodePropertyName),
    [ts.get(parameter, memberList[0].name)]
  );
  for (const member of memberList.slice(1)) {
    e = ts.callMethod(e, "concat", [
      ts.call(ts.get(codecExprUse(member.type), util.encodePropertyName), [
        ts.get(parameter, member.name),
      ]),
    ]);
  }
  return [ts.statementReturn(e)];
};

const sumEncodeDefinitionStatementList = (
  patternList: ReadonlyArray<data.Pattern>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => {
  if (util.isTagTypeAllNoParameter(patternList)) {
    return [
      ts.statementSwitch({
        expr: parameter,
        patternList: patternList.map((pattern, index) =>
          patternToSwitchPattern(pattern, index, parameter)
        ),
      }),
    ];
  }
  return [
    ts.statementSwitch({
      expr: ts.get(parameter, "_"),
      patternList: patternList.map((tagNameAndParameter, index) =>
        patternToSwitchPattern(tagNameAndParameter, index, parameter)
      ),
    }),
  ];
};

const patternToSwitchPattern = (
  patternList: data.Pattern,
  index: number,
  parameter: ts.Expr
): ts.Pattern => {
  const returnExpr = ((): ts.Expr => {
    switch (patternList.parameter._) {
      case "Just":
        return ts.callMethod(
          ts.arrayLiteral([{ expr: ts.numberLiteral(index), spread: false }]),
          "concat",
          [
            encodeExprUse(
              patternList.parameter.value,
              ts.get(
                parameter,
                util.typeToMemberOrParameterName(patternList.parameter.value)
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
    caseTag: patternList.name,
    statementList: [ts.statementReturn(returnExpr)],
  };
};

/**
 * Decode Definition
 */
const decodeExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  return codec.decodeLambda(
    ts.typeWithParameter(
      ts.typeScopeInFile(identifer.fromString(customTypeDefinition.name)),
      customTypeDefinition.typeParameterList.map((typeParameter) =>
        ts.typeScopeInFile(identifer.fromString(typeParameter))
      )
    ),
    (parameterIndex, parameterBinary) => {
      switch (customTypeDefinition.body._) {
        case "Product":
          return productDecodeDefinitionStatementList(
            customTypeDefinition.body.memberList,
            parameterIndex,
            parameterBinary
          );
        case "Sum":
          return sumDecodeDefinitionStatementList(
            customTypeDefinition.body.patternList,
            customTypeDefinition.name,
            parameterIndex,
            parameterBinary,
            customTypeDefinition.typeParameterList.length === 0
          );
      }
    }
  );
};

const productDecodeDefinitionStatementList = (
  memberList: ReadonlyArray<data.Member>,
  parameterIndex: ts.Expr,
  parameterBinary: ts.Expr
): ReadonlyArray<ts.Statement> => {
  const resultAndNextIndexNameIdentifer = (
    member: data.Member
  ): identifer.Identifer => identifer.fromString(member.name + "AndNextIndex");

  const memberDecoderCode = memberList.reduce<{
    nextIndexExpr: ts.Expr;
    statementList: ReadonlyArray<ts.Statement>;
  }>(
    (statementAndNextIndexExpr, memberNameAndType) => {
      const resultAndNextIndexName = resultAndNextIndexNameIdentifer(
        memberNameAndType
      );
      const resultAndNextIndexVar = ts.variable(resultAndNextIndexName);

      return {
        nextIndexExpr: codec.getNextIndex(resultAndNextIndexVar),
        statementList: statementAndNextIndexExpr.statementList.concat(
          ts.statementVariableDefinition(
            resultAndNextIndexName,
            codec.decodeReturnType(
              util.typeToTypeScriptType(memberNameAndType.type)
            ),
            decodeExprUse(
              memberNameAndType.type,
              statementAndNextIndexExpr.nextIndexExpr,
              parameterBinary
            )
          )
        ),
      };
    },
    { nextIndexExpr: parameterIndex, statementList: [] }
  );
  return memberDecoderCode.statementList.concat(
    codec.returnStatement(
      ts.objectLiteral(
        memberList.map(
          (memberNameAndType): ts.Member =>
            ts.memberKeyValue(
              memberNameAndType.name,
              codec.getResult(
                ts.variable(resultAndNextIndexNameIdentifer(memberNameAndType))
              )
            )
        )
      ),
      memberDecoderCode.nextIndexExpr
    )
  );
};

const sumDecodeDefinitionStatementList = (
  patternList: ReadonlyArray<data.Pattern>,
  customTypeName: string,
  parameterIndex: ts.Expr,
  parameterBinary: ts.Expr,
  noTypeParameter: boolean
): ReadonlyArray<ts.Statement> => {
  const patternIndexAndNextIndexName = identifer.fromString("patternIndex");
  const patternIndexAndNextIndexVar = ts.variable(patternIndexAndNextIndexName);

  return [
    ts.statementVariableDefinition(
      patternIndexAndNextIndexName,
      codec.decodeReturnType(ts.typeNumber),
      int32.decode(parameterIndex, parameterBinary)
    ),
    ...patternList.map((pattern, index) =>
      tagNameAndParameterCode(
        customTypeName,
        pattern,
        index,
        patternIndexAndNextIndexVar,
        parameterBinary,
        noTypeParameter
      )
    ),
    ts.statementThrowError(
      ts.stringLiteral("存在しないパターンを指定された 型を更新してください")
    ),
  ];
};

const tagNameAndParameterCode = (
  customTypeName: string,
  pattern: data.Pattern,
  index: number,
  patternIndexAndNextIndexVar: ts.Expr,
  parameterBinary: ts.Expr,
  noTypeParameter: boolean
): ts.Statement => {
  switch (pattern.parameter._) {
    case "Just":
      return ts.statementIf(
        ts.equal(
          codec.getResult(patternIndexAndNextIndexVar),
          ts.numberLiteral(index)
        ),
        [
          ts.statementVariableDefinition(
            identifer.fromString("result"),
            codec.decodeReturnType(
              util.typeToTypeScriptType(pattern.parameter.value)
            ),
            decodeExprUse(
              pattern.parameter.value,
              codec.getNextIndex(patternIndexAndNextIndexVar),
              parameterBinary
            )
          ),
          codec.returnStatement(
            patternUse(
              customTypeName,
              noTypeParameter,
              pattern.name,
              data.Maybe.Just(
                codec.getResult(ts.variable(identifer.fromString("result")))
              )
            ),
            codec.getNextIndex(ts.variable(identifer.fromString("result")))
          ),
        ]
      );
    case "Nothing":
      return ts.statementIf(
        ts.equal(
          codec.getResult(patternIndexAndNextIndexVar),
          ts.numberLiteral(index)
        ),
        [
          codec.returnStatement(
            patternUse(
              customTypeName,
              noTypeParameter,
              pattern.name,
              data.Maybe.Nothing()
            ),
            codec.getNextIndex(patternIndexAndNextIndexVar)
          ),
        ]
      );
  }
};

const patternUse = (
  customTypeName: string,
  noTypeParameter: boolean,
  tagName: string,
  parameter: data.Maybe<ts.Expr>
): ts.Expr => {
  const tagExpr = ts.get(
    ts.variable(identifer.fromString(customTypeName)),
    tagName
  );
  switch (parameter._) {
    case "Just":
      return ts.call(tagExpr, [parameter.value]);
    case "Nothing":
      if (noTypeParameter) {
        return tagExpr;
      }
      return ts.call(tagExpr, []);
  }
};

const encodeExprUse = (type_: data.Type, target: ts.Expr): ts.Expr =>
  ts.call(ts.get(codecExprUse(type_), util.encodePropertyName), [target]);

const decodeExprUse = (
  type_: data.Type,
  indexExpr: ts.Expr,
  binaryExpr: ts.Expr
) =>
  ts.call(ts.get(codecExprUse(type_), util.decodePropertyName), [
    indexExpr,
    binaryExpr,
  ]);

const codecExprUse = (type_: data.Type): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return int32.codec();
    case "String":
      return kernelString.codec();
    case "Bool":
      return bool.codec();
    case "Binary":
      return binary.codec();
    case "Url":
      return url.codec();
    case "List":
      return ts.call(
        ts.get(
          ts.variable(identifer.fromString("List")),
          util.codecPropertyName
        ),
        [codecExprUse(type_.type)]
      );
    case "Maybe":
      return ts.call(
        ts.get(
          ts.variable(identifer.fromString("Maybe")),
          util.codecPropertyName
        ),
        [codecExprUse(type_.type)]
      );
    case "Result":
      return ts.call(
        ts.get(
          ts.variable(identifer.fromString("Result")),
          util.codecPropertyName
        ),
        [
          codecExprUse(type_.okAndErrorType.ok),
          codecExprUse(type_.okAndErrorType.error),
        ]
      );
    case "Id":
      return ts.get(
        ts.variable(identifer.fromString(type_.string)),
        util.codecPropertyName
      );
    case "Token":
      return ts.get(
        ts.variable(identifer.fromString(type_.string)),
        util.codecPropertyName
      );
    case "Custom":
      if (type_.nameAndTypeParameterList.parameterList.length === 0) {
        return ts.get(
          ts.variable(
            identifer.fromString(type_.nameAndTypeParameterList.name)
          ),
          util.codecPropertyName
        );
      }
      return ts.call(
        ts.get(
          ts.variable(
            identifer.fromString(type_.nameAndTypeParameterList.name)
          ),
          util.codecPropertyName
        ),
        type_.nameAndTypeParameterList.parameterList.map((parameter) =>
          codecExprUse(parameter)
        )
      );
    case "Parameter":
      return ts.variable(codecParameterName(type_.string));
  }
};
