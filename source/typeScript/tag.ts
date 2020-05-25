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
                  Maybe
   ========================================
*/

const maybeJustName = identifer.fromString("maybeJust");

export const maybeJustVarEval = (expr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(maybeJustName), [expr]);

const maybeNothingName = identifer.fromString("maybeNothing");
export const maybeNothingVarEval: ts.Expr = ts.call(
  ts.variable(maybeNothingName),
  []
);

/* ========================================
                  Result
   ========================================
*/
const resultOkName = identifer.fromString("resultOk");

export const resultOkVarEval = (okExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultOkName), [okExpr]);

const resultErrorName = identifer.fromString("resultError");

export const resultErrorVarEval = (errorExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultErrorName), [errorExpr]);

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
      return ts.typeObject(new Map(encodeAndDecodeType(customType)));
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
            .concat(encodeAndDecodeType(customType))
        )
      );
  }
};

const customTypeDefinitionToExpr = (
  customType: type.CustomTypeDefinition
): ts.Expr => {
  switch (customType.body._) {
    case "Product":
      return ts.objectLiteral([]);

    case "Sum": {
      const tagNameAndParameterList = customType.body.tagNameAndParameterList;
      return ts.objectLiteral(
        tagNameAndParameterList.map((tagNameAndParameter) =>
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

const encodeAndDecodeType = (
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
