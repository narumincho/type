import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "./type";
import * as util from "./util";
import * as c from "./case";
import * as codec from "./kernel/codec";
import * as int32 from "./kernel/int32";
import * as kernelString from "./kernel/string";
import * as bool from "./kernel/bool";
import * as maybe from "./kernel/maybe";
import * as result from "./kernel/result";
import * as binary from "./kernel/binary";
import * as list from "./kernel/list";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idAndTokenNameSet: type.IdAndTokenNameSet,
  withKernel: boolean
): ReadonlyArray<ts.Variable> => {
  if (withKernel) {
    const customTypeAndDefaultTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
      maybe.customTypeDefinition,
      result.customTypeDefinition,
      ...customTypeList,
    ];
    return [
      int32.exprDefinition(),
      kernelString.exprDefinition(),
      bool.exprDefinition(),
      binary.exprDefinition(),
      list.exprDefinition(),
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
      return ts.objectLiteral(
        customTypeToCodecDefinitionMember(customType, withKernel)
      );

    case "Sum": {
      const patternList = customType.body.patternList;
      return ts.objectLiteral(
        patternList
          .map((pattern) =>
            ts.memberKeyValue(
              pattern.name,
              type.isTagTypeAllNoParameter(patternList)
                ? ts.stringLiteral(pattern.name)
                : patternToTagExpr(
                    identifer.fromString(customType.name),
                    customType.typeParameterList,
                    pattern
                  )
            )
          )
          .concat(customTypeToCodecDefinitionMember(customType, withKernel))
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

const patternToTagExpr = (
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

const customTypeToCodecDefinitionMember = (
  customType: type.CustomTypeDefinition,
  withKernel: boolean
): ReadonlyArray<ts.Member> => {
  return [
    ts.memberKeyValue(
      util.codecPropertyName,
      codecExprDefinition(customType, withKernel)
    ),
  ];
};

const codecParameterName = (name: string): identifer.Identifer =>
  identifer.fromString(name + "Codec");

const codecExprDefinition = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
  if (customTypeDefinition.typeParameterList.length === 0) {
    return codecDefinitionBodyExpr(customTypeDefinition, withKernel);
  }
  return ts.lambda(
    customTypeDefinition.typeParameterList.map((typeParameter) => ({
      name: codecParameterName(typeParameter),
      type_: codec.codecType(
        ts.typeScopeInFile(identifer.fromString(typeParameter)),
        withKernel
      ),
    })),
    customTypeDefinition.typeParameterList.map(identifer.fromString),
    codec.codecType(
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
        codecDefinitionBodyExpr(customTypeDefinition, withKernel)
      ),
    ]
  );
};

const codecDefinitionBodyExpr = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
): ts.Expr => {
  return ts.objectLiteral([
    ts.memberKeyValue(
      util.encodePropertyName,
      encodeExprDefinition(customTypeDefinition, withKernel)
    ),
    ts.memberKeyValue(
      util.decodePropertyName,
      decodeExprDefinition(customTypeDefinition, withKernel)
    ),
  ]);
};

/**
 * Encode Definition
 */
const encodeExprDefinition = (
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
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
            valueVar,
            withKernel
          );
        case "Sum":
          return sumEncodeDefinitionStatementList(
            customTypeDefinition.body.patternList,
            valueVar,
            withKernel
          );
      }
    }
  );

const productEncodeDefinitionStatementList = (
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

const sumEncodeDefinitionStatementList = (
  patternList: ReadonlyArray<type.Pattern>,
  parameter: ts.Expr,
  withKernel: boolean
): ReadonlyArray<ts.Statement> => {
  if (type.isTagTypeAllNoParameter(patternList)) {
    return [
      ts.statementSwitch({
        expr: parameter,
        patternList: patternList.map((pattern, index) =>
          patternToSwitchPattern(pattern, index, parameter, withKernel)
        ),
      }),
    ];
  }
  return [
    ts.statementSwitch({
      expr: ts.get(parameter, "_"),
      patternList: patternList.map((tagNameAndParameter, index) =>
        patternToSwitchPattern(
          tagNameAndParameter,
          index,
          parameter,
          withKernel
        )
      ),
    }),
  ];
};

const patternToSwitchPattern = (
  patternList: type.Pattern,
  index: number,
  parameter: ts.Expr,
  withKernel: boolean
): ts.Pattern => {
  const returnExpr = ((): ts.Expr => {
    switch (patternList.parameter._) {
      case "Just":
        return ts.callMethod(
          ts.arrayLiteral([{ expr: ts.numberLiteral(index), spread: false }]),
          "concat",
          [
            encodeExprUse(
              withKernel,
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
  customTypeDefinition: type.CustomTypeDefinition,
  withKernel: boolean
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
            withKernel,
            customTypeDefinition.body.memberList,
            parameterIndex,
            parameterBinary
          );
        case "Sum":
          return sumDecodeDefinitionStatementList(
            withKernel,
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
  withKernel: boolean,
  memberList: ReadonlyArray<type.Member>,
  parameterIndex: ts.Expr,
  parameterBinary: ts.Expr
): ReadonlyArray<ts.Statement> => {
  const resultAndNextIndexNameIdentifer = (
    member: type.Member
  ): identifer.Identifer => identifer.fromString(member.name + "AndNextIndex");

  const memberDecoderCode = memberList.reduce<{
    nextIndexExpr: ts.Expr;
    statementList: ReadonlyArray<ts.Statement>;
  }>(
    (data, memberNameAndType) => {
      const resultAndNextIndexName = resultAndNextIndexNameIdentifer(
        memberNameAndType
      );
      const resultAndNextIndexVar = ts.variable(resultAndNextIndexName);

      return {
        nextIndexExpr: codec.getNextIndex(resultAndNextIndexVar),
        statementList: data.statementList.concat(
          ts.statementVariableDefinition(
            resultAndNextIndexName,
            codec.decodeReturnType(
              util.typeToTypeScriptType(memberNameAndType.type)
            ),
            decodeExprUse(
              withKernel,
              memberNameAndType.type,
              data.nextIndexExpr,
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
  withKernel: boolean,
  patternList: ReadonlyArray<type.Pattern>,
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
      int32.decode(withKernel, parameterIndex, parameterBinary)
    ),
    ...patternList.map((pattern, index) =>
      tagNameAndParameterCode(
        withKernel,
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
  withKernel: boolean,
  customTypeName: string,
  pattern: type.Pattern,
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
              withKernel,
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
              type.Maybe.Just(
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
              type.Maybe.Nothing()
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
  parameter: type.Maybe<ts.Expr>
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

const encodeExprUse = (
  withKernel: boolean,
  type_: type.Type,
  target: ts.Expr
): ts.Expr =>
  ts.call(ts.get(codecExprUse(type_, withKernel), util.encodePropertyName), [
    target,
  ]);

const decodeExprUse = (
  withKernel: boolean,
  type_: type.Type,
  index: ts.Expr,
  binary: ts.Expr
) =>
  ts.call(ts.get(codecExprUse(type_, withKernel), util.decodePropertyName), [
    index,
    binary,
  ]);

const codecExprUse = (type_: type.Type, withKernel: boolean): ts.Expr => {
  switch (type_._) {
    case "Int32":
      return int32.codec(withKernel);
    case "String":
      return kernelString.codec(withKernel);
    case "Bool":
      return bool.codec(withKernel);
    case "Binary":
      return binary.codec(withKernel);
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
