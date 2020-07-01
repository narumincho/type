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
import * as ts from "js-ts-code-generator/distribution/newData";
import * as url from "./kernel/url";
import * as util from "./util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

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
): ts.Identifer => {
  return identifer.fromString(
    util.firstLowerCase(customTypeName) + util.firstUpperCase(tagName)
  );
};

export const customTypeVar = (
  customTypeName: string,
  tagName: string
): ts.Expr =>
  ts.Expr.Variable(customTypeNameIdentifer(customTypeName, tagName));

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
      return ts.Type.Object([
        {
          name: util.codecPropertyName,
          required: true,
          type: customTypeToCodecType(customType),
          document: "",
        },
      ]);
    case "Sum":
      return ts.Type.Object(
        customType.body.patternList
          .map(
            (pattern): ts.MemberType => ({
              name: pattern.name,
              required: true,
              type: tagNameAndParameterToTagExprType(
                identifer.fromString(customType.name),
                customType.typeParameterList,
                pattern
              ),
              document: pattern.description,
            })
          )
          .concat({
            name: util.codecPropertyName,
            required: true,
            type: customTypeToCodecType(customType),
            document: "",
          })
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: data.CustomTypeDefinition
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.Expr.ObjectLiteral(
        customTypeToCodecDefinitionMember(customType)
      );

    case "Sum": {
      const { patternList } = customType.body;
      return ts.Expr.ObjectLiteral(
        patternList
          .map((pattern) =>
            ts.Member.KeyValue({
              key: pattern.name,
              value: util.isTagTypeAllNoParameter(patternList)
                ? ts.Expr.StringLiteral(pattern.name)
                : patternToTagExpr(
                    identifer.fromString(customType.name),
                    customType.typeParameterList,
                    pattern
                  ),
            })
          )
          .concat(customTypeToCodecDefinitionMember(customType))
      );
    }
  }
};

const tagNameAndParameterToTagExprType = (
  typeName: ts.Identifer,
  typeParameterList: ReadonlyArray<string>,
  pattern: data.Pattern
) => {
  const typeParameterIdentiferList = typeParameterList.map(
    identifer.fromString
  );
  const returnType = ts.Type.WithTypeParameter({
    type: ts.Type.ScopeInFile(typeName),
    typeParameterList: typeParameterIdentiferList.map(
      (typeParameterIdentifer) => ts.Type.ScopeInFile(typeParameterIdentifer)
    ),
  });

  switch (pattern.parameter._) {
    case "Just":
      return ts.Type.Function({
        typeParameterList: typeParameterIdentiferList,
        parameterList: [util.typeToTypeScriptType(pattern.parameter.value)],
        return: returnType,
      });

    case "Nothing":
      if (typeParameterList.length === 0) {
        return returnType;
      }
      return ts.Type.Function({
        typeParameterList: typeParameterIdentiferList,
        parameterList: [],
        return: returnType,
      });
  }
};

const patternToTagExpr = (
  typeName: ts.Identifer,
  typeParameterList: ReadonlyArray<string>,
  pattern: data.Pattern
): ts.Expr => {
  const tagField: ts.Member = ts.Member.KeyValue({
    key: "_",
    value: ts.Expr.StringLiteral(pattern.name),
  });
  const returnType = ts.Type.WithTypeParameter({
    type: ts.Type.ScopeInFile(typeName),
    typeParameterList: typeParameterList.map((typeParameter) =>
      ts.Type.ScopeInFile(identifer.fromString(typeParameter))
    ),
  });

  switch (pattern.parameter._) {
    case "Just": {
      const parameterIdentifer = identifer.fromString(
        util.typeToMemberOrParameterName(pattern.parameter.value)
      );
      return ts.Expr.Lambda({
        typeParameterList: typeParameterList.map(identifer.fromString),
        parameterList: [
          {
            name: parameterIdentifer,
            type: util.typeToTypeScriptType(pattern.parameter.value),
          },
        ],
        returnType,
        statementList: [
          ts.Statement.Return(
            ts.Expr.ObjectLiteral([
              tagField,
              ts.Member.KeyValue({
                key: util.typeToMemberOrParameterName(pattern.parameter.value),
                value: ts.Expr.Variable(parameterIdentifer),
              }),
            ])
          ),
        ],
      });
    }

    case "Nothing":
      if (typeParameterList.length === 0) {
        return ts.Expr.ObjectLiteral([tagField]);
      }
      return ts.Expr.Lambda({
        typeParameterList: typeParameterList.map(identifer.fromString),
        parameterList: [],
        returnType,
        statementList: [ts.Statement.Return(ts.Expr.ObjectLiteral([tagField]))],
      });
  }
};

/** カスタム型の式のcodecプロパティの型 */
const customTypeToCodecType = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Type =>
  codec.codecTypeWithTypeParameter(
    ts.Type.ScopeInFile(identifer.fromString(customTypeDefinition.name)),
    customTypeDefinition.typeParameterList
  );

const customTypeToCodecDefinitionMember = (
  customType: data.CustomTypeDefinition
): ReadonlyArray<ts.Member> => {
  return [
    ts.Member.KeyValue({
      key: util.codecPropertyName,
      value: codecExprDefinition(customType),
    }),
  ];
};

const codecParameterName = (name: string): ts.Identifer =>
  identifer.fromString(name + "Codec");

const codecExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  if (customTypeDefinition.typeParameterList.length === 0) {
    return codecDefinitionBodyExpr(customTypeDefinition);
  }
  return ts.Expr.Lambda({
    typeParameterList: customTypeDefinition.typeParameterList.map(
      identifer.fromString
    ),
    parameterList: customTypeDefinition.typeParameterList.map(
      (typeParameter) => ({
        name: codecParameterName(typeParameter),
        type: codec.codecType(
          ts.Type.ScopeInFile(identifer.fromString(typeParameter))
        ),
      })
    ),
    returnType: codec.codecType(
      ts.Type.WithTypeParameter({
        type: ts.Type.ScopeInFile(
          identifer.fromString(customTypeDefinition.name)
        ),
        typeParameterList: customTypeDefinition.typeParameterList.map(
          (typeParameter) =>
            ts.Type.ScopeInFile(identifer.fromString(typeParameter))
        ),
      })
    ),
    statementList: [
      ts.Statement.Return(codecDefinitionBodyExpr(customTypeDefinition)),
    ],
  });
};

const codecDefinitionBodyExpr = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  return ts.Expr.ObjectLiteral([
    ts.Member.KeyValue({
      key: util.encodePropertyName,
      value: encodeExprDefinition(customTypeDefinition),
    }),
    ts.Member.KeyValue({
      key: util.decodePropertyName,
      value: decodeExprDefinition(customTypeDefinition),
    }),
  ]);
};

/**
 * Encode Definition
 */
const encodeExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr =>
  codec.encodeLambda(
    ts.Type.WithTypeParameter({
      type: ts.Type.ScopeInFile(
        identifer.fromString(customTypeDefinition.name)
      ),
      typeParameterList: customTypeDefinition.typeParameterList.map(
        (typeParameter) =>
          ts.Type.ScopeInFile(identifer.fromString(typeParameter))
      ),
    }),
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
    return [ts.Statement.Return(ts.Expr.ArrayLiteral([]))];
  }
  let e = ts.Expr.Call({
    expr: tsUtil.get(codecExprUse(memberList[0].type), util.encodePropertyName),
    parameterList: [tsUtil.get(parameter, memberList[0].name)],
  });
  for (const member of memberList.slice(1)) {
    e = tsUtil.callMethod(e, "concat", [
      ts.Expr.Call({
        expr: tsUtil.get(codecExprUse(member.type), util.encodePropertyName),
        parameterList: [tsUtil.get(parameter, member.name)],
      }),
    ]);
  }
  return [ts.Statement.Return(e)];
};

const sumEncodeDefinitionStatementList = (
  patternList: ReadonlyArray<data.Pattern>,
  parameter: ts.Expr
): ReadonlyArray<ts.Statement> => [
  ts.Statement.Switch({
    expr: util.isTagTypeAllNoParameter(patternList)
      ? parameter
      : tsUtil.get(parameter, "_"),
    patternList: patternList.map((pattern, index) =>
      patternToSwitchPattern(pattern, index, parameter)
    ),
  }),
];

const patternToSwitchPattern = (
  patternList: data.Pattern,
  index: number,
  parameter: ts.Expr
): ts.Pattern => {
  const returnExpr = ((): ts.Expr => {
    switch (patternList.parameter._) {
      case "Just":
        return tsUtil.callMethod(
          ts.Expr.ArrayLiteral([
            { expr: ts.Expr.NumberLiteral(index), spread: false },
          ]),
          "concat",
          [
            encodeExprUse(
              patternList.parameter.value,
              tsUtil.get(
                parameter,
                util.typeToMemberOrParameterName(patternList.parameter.value)
              )
            ),
          ]
        );

      case "Nothing":
        return ts.Expr.ArrayLiteral([
          { expr: ts.Expr.NumberLiteral(index), spread: false },
        ]);
    }
  })();
  return {
    caseString: patternList.name,
    statementList: [ts.Statement.Return(returnExpr)],
  };
};

/**
 * Decode Definition
 */
const decodeExprDefinition = (
  customTypeDefinition: data.CustomTypeDefinition
): ts.Expr => {
  return codec.decodeLambda(
    ts.Type.WithTypeParameter({
      type: ts.Type.ScopeInFile(
        identifer.fromString(customTypeDefinition.name)
      ),
      typeParameterList: customTypeDefinition.typeParameterList.map(
        (typeParameter) =>
          ts.Type.ScopeInFile(identifer.fromString(typeParameter))
      ),
    }),
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
  const resultAndNextIndexNameIdentifer = (member: data.Member): ts.Identifer =>
    identifer.fromString(member.name + "AndNextIndex");

  const memberDecoderCode = memberList.reduce<{
    nextIndexExpr: ts.Expr;
    statementList: ReadonlyArray<ts.Statement>;
  }>(
    (statementAndNextIndexExpr, memberNameAndType) => {
      const resultAndNextIndexName = resultAndNextIndexNameIdentifer(
        memberNameAndType
      );
      const resultAndNextIndexVar = ts.Expr.Variable(resultAndNextIndexName);

      return {
        nextIndexExpr: codec.getNextIndex(resultAndNextIndexVar),
        statementList: statementAndNextIndexExpr.statementList.concat(
          ts.Statement.VariableDefinition({
            isConst: true,
            name: resultAndNextIndexName,
            type: codec.decodeReturnType(
              util.typeToTypeScriptType(memberNameAndType.type)
            ),
            expr: decodeExprUse(
              memberNameAndType.type,
              statementAndNextIndexExpr.nextIndexExpr,
              parameterBinary
            ),
          })
        ),
      };
    },
    { nextIndexExpr: parameterIndex, statementList: [] }
  );
  return memberDecoderCode.statementList.concat(
    codec.returnStatement(
      ts.Expr.ObjectLiteral(
        memberList.map(
          (memberNameAndType): ts.Member =>
            ts.Member.KeyValue({
              key: memberNameAndType.name,
              value: codec.getResult(
                ts.Expr.Variable(
                  resultAndNextIndexNameIdentifer(memberNameAndType)
                )
              ),
            })
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
  const patternIndexAndNextIndexVar = ts.Expr.Variable(
    patternIndexAndNextIndexName
  );

  return [
    ts.Statement.VariableDefinition({
      isConst: true,
      name: patternIndexAndNextIndexName,
      type: codec.decodeReturnType(ts.Type.Number),
      expr: int32.decode(parameterIndex, parameterBinary),
    }),
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
    ts.Statement.ThrowError(
      ts.Expr.StringLiteral(
        "存在しないパターンを指定された 型を更新してください"
      )
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
      return ts.Statement.If({
        condition: tsUtil.equal(
          codec.getResult(patternIndexAndNextIndexVar),
          ts.Expr.NumberLiteral(index)
        ),
        thenStatementList: [
          ts.Statement.VariableDefinition({
            isConst: true,
            name: identifer.fromString("result"),
            type: codec.decodeReturnType(
              util.typeToTypeScriptType(pattern.parameter.value)
            ),
            expr: decodeExprUse(
              pattern.parameter.value,
              codec.getNextIndex(patternIndexAndNextIndexVar),
              parameterBinary
            ),
          }),
          codec.returnStatement(
            patternUse(
              customTypeName,
              noTypeParameter,
              pattern.name,
              data.Maybe.Just(
                codec.getResult(
                  ts.Expr.Variable(identifer.fromString("result"))
                )
              )
            ),
            codec.getNextIndex(ts.Expr.Variable(identifer.fromString("result")))
          ),
        ],
      });
    case "Nothing":
      return ts.Statement.If({
        condition: tsUtil.equal(
          codec.getResult(patternIndexAndNextIndexVar),
          ts.Expr.NumberLiteral(index)
        ),
        thenStatementList: [
          codec.returnStatement(
            patternUse(
              customTypeName,
              noTypeParameter,
              pattern.name,
              data.Maybe.Nothing()
            ),
            codec.getNextIndex(patternIndexAndNextIndexVar)
          ),
        ],
      });
  }
};

const patternUse = (
  customTypeName: string,
  noTypeParameter: boolean,
  tagName: string,
  parameter: data.Maybe<ts.Expr>
): ts.Expr => {
  const tagExpr = tsUtil.get(
    ts.Expr.Variable(identifer.fromString(customTypeName)),
    tagName
  );
  switch (parameter._) {
    case "Just":
      return ts.Expr.Call({ expr: tagExpr, parameterList: [parameter.value] });
    case "Nothing":
      if (noTypeParameter) {
        return tagExpr;
      }
      return ts.Expr.Call({ expr: tagExpr, parameterList: [] });
  }
};

const encodeExprUse = (type_: data.Type, target: ts.Expr): ts.Expr =>
  ts.Expr.Call({
    expr: tsUtil.get(codecExprUse(type_), util.encodePropertyName),
    parameterList: [target],
  });

const decodeExprUse = (
  type_: data.Type,
  indexExpr: ts.Expr,
  binaryExpr: ts.Expr
) =>
  ts.Expr.Call({
    expr: tsUtil.get(codecExprUse(type_), util.decodePropertyName),
    parameterList: [indexExpr, binaryExpr],
  });

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
      return ts.Expr.Call({
        expr: tsUtil.get(
          ts.Expr.Variable(identifer.fromString("List")),
          util.codecPropertyName
        ),
        parameterList: [codecExprUse(type_.type)],
      });
    case "Maybe":
      return ts.Expr.Call({
        expr: tsUtil.get(
          ts.Expr.Variable(identifer.fromString("Maybe")),
          util.codecPropertyName
        ),
        parameterList: [codecExprUse(type_.type)],
      });
    case "Result":
      return ts.Expr.Call({
        expr: tsUtil.get(
          ts.Expr.Variable(identifer.fromString("Result")),
          util.codecPropertyName
        ),
        parameterList: [
          codecExprUse(type_.okAndErrorType.ok),
          codecExprUse(type_.okAndErrorType.error),
        ],
      });
    case "Id":
      return tsUtil.get(
        ts.Expr.Variable(identifer.fromString(type_.string)),
        util.codecPropertyName
      );
    case "Token":
      return tsUtil.get(
        ts.Expr.Variable(identifer.fromString(type_.string)),
        util.codecPropertyName
      );
    case "Custom":
      if (type_.nameAndTypeParameterList.parameterList.length === 0) {
        return tsUtil.get(
          ts.Expr.Variable(
            identifer.fromString(type_.nameAndTypeParameterList.name)
          ),
          util.codecPropertyName
        );
      }
      return ts.Expr.Call({
        expr: tsUtil.get(
          ts.Expr.Variable(
            identifer.fromString(type_.nameAndTypeParameterList.name)
          ),
          util.codecPropertyName
        ),
        parameterList: type_.nameAndTypeParameterList.parameterList.map(
          (parameter) => codecExprUse(parameter)
        ),
      });
    case "Parameter":
      return ts.Expr.Variable(codecParameterName(type_.string));
  }
};
