import * as generator from "js-ts-code-generator";
import * as type from "../type";
import * as c from "../case";
import * as typeScript from "../typeScript";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): {
  exportTypeAliasMap: ReadonlyMap<string, generator.ExportTypeAlias>;
  exportConstEnumMap: ReadonlyMap<
    string,
    generator.type.ExportConstEnumTagNameAndValueList
  >;
  exportFunctionMap: ReadonlyMap<string, generator.ExportFunction>;
} => {
  const exportConstEnumMap = new Map<
    string,
    generator.type.ExportConstEnumTagNameAndValueList
  >();
  const exportTypeAliasMap = new Map<string, generator.ExportTypeAlias>();
  for (const customType of customTypeDictionary.entries()) {
    const definition = toTypeAliasAndEnum(customType);
    if (definition.typeAlias !== null) {
      exportTypeAliasMap.set(definition.typeAlias[0], definition.typeAlias[1]);
    }
    if (definition.enum !== null) {
      exportConstEnumMap.set(definition.enum[0], definition.enum[1]);
    }
  }
  return {
    exportConstEnumMap,
    exportTypeAliasMap,
    exportFunctionMap: customTypeDictionaryToTagFunctionList(
      customTypeDictionary
    )
  };
};

export const toTypeAliasAndEnum = ([customTypeName, customType]: [
  string,
  type.CustomType
]): {
  typeAlias: [string, generator.ExportTypeAlias] | null;
  enum: [string, generator.type.ExportConstEnumTagNameAndValueList] | null;
} => {
  switch (customType.body._) {
    case type.CustomType_.Sum:
      if (
        typeScript.isProductTypeAllNoParameter(
          customType.body.tagNameAndParameterArray
        )
      ) {
        return {
          typeAlias: null,
          enum: [
            typeScript.customTypeToTypeName(customTypeName),
            new Map(
              customType.body.tagNameAndParameterArray.map(
                (tagNameAndParameter, index) => [
                  typeScript.tagNameToEnumTag(tagNameAndParameter.name),
                  index
                ]
              )
            )
          ]
        };
      }
      return {
        typeAlias: [
          typeScript.customTypeToTypeName(customTypeName),
          {
            document: customType.description,
            typeExpr: generator.typeExpr.union(
              customType.body.tagNameAndParameterArray.map(
                tagNameAndParameter =>
                  tagNameAndParameterToObjectType(
                    typeScript.customTypeNameToEnumName(customTypeName),
                    tagNameAndParameter
                  )
              )
            )
          }
        ],
        enum: [
          typeScript.customTypeNameToEnumName(customTypeName),
          new Map(
            customType.body.tagNameAndParameterArray.map(
              (tagNameAndParameter, index) => [
                typeScript.tagNameToEnumTag(tagNameAndParameter.name),
                index
              ]
            )
          )
        ]
      };
    case type.CustomType_.Product:
      return {
        typeAlias: [
          typeScript.customTypeToTypeName(customTypeName),
          {
            document: customType.description,
            typeExpr: generator.typeExpr.object(
              new Map(
                customType.body.memberNameAndTypeArray.map(
                  memberNameAndType => [
                    memberNameAndType.name,
                    {
                      typeExpr: typeScript.typeToGeneratorType(
                        memberNameAndType.memberType
                      ),
                      document: memberNameAndType.description
                    }
                  ]
                )
              )
            )
          }
        ],
        enum: null
      };
  }
};

const tagNameAndParameterToObjectType = (
  enumName: string,
  tagNameAndParameter: type.TagNameAndParameter
): generator.typeExpr.TypeExpr => {
  const tagField: [
    string,
    { typeExpr: generator.typeExpr.TypeExpr; document: string }
  ] = [
    "_",
    {
      document: "",
      typeExpr: generator.typeExpr.enumTagLiteral(
        enumName,
        typeScript.tagNameToEnumTag(tagNameAndParameter.name)
      )
    }
  ];

  switch (tagNameAndParameter.parameter._) {
    case type.TagParameter_.Just:
      return generator.typeExpr.object(
        new Map([
          tagField,
          [
            typeScript.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.type_
            ),
            {
              document: "",
              typeExpr: typeScript.typeToGeneratorType(
                tagNameAndParameter.parameter.type_
              )
            }
          ]
        ])
      );
    case type.TagParameter_.Nothing:
      return generator.typeExpr.object(new Map([tagField]));
  }
};

const customTypeDictionaryToTagFunctionList = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): ReadonlyMap<string, generator.ExportFunction> => {
  const result = new Map<string, generator.ExportFunction>();
  for (const [customTypeName, customType] of customTypeDictionary.entries()) {
    switch (customType.body._) {
      case type.CustomType_.Sum: {
        if (
          typeScript.isProductTypeAllNoParameter(
            customType.body.tagNameAndParameterArray
          )
        ) {
          break;
        }
        const functionList = productTypeToTagFunctionList(
          customTypeName,
          customType.body.tagNameAndParameterArray,
          customTypeDictionary
        );
        for (const [funcName, func] of functionList) {
          result.set(funcName, func);
        }
      }
    }
  }
  return result;
};

const productTypeToTagFunctionList = (
  customTypeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): ReadonlyMap<string, generator.ExportFunction> => {
  const result = new Map<string, generator.ExportFunction>();

  for (const tagNameAndParameter of tagNameAndParameterArray) {
    result.set(
      c.firstLowerCase(typeScript.customTypeToTypeName(customTypeName)) +
        c.firstUpperCase(tagNameAndParameter.name),
      {
        document: tagNameAndParameter.description,
        parameterList: tagFunctionParameter(tagNameAndParameter.parameter),
        returnType: generator.typeExpr.globalType(
          typeScript.customTypeToTypeName(customTypeName)
        ),
        statementList: tagFunctionStatement(
          customTypeName,
          tagNameAndParameter,
          customTypeDictionary
        )
      }
    );
  }

  return result;
};

const tagFunctionParameter = (
  tagParameter: type.TagParameter
): ReadonlyArray<{
  readonly name: string;
  readonly document: string;
  readonly typeExpr: generator.typeExpr.TypeExpr;
}> => {
  switch (tagParameter._) {
    case type.TagParameter_.Just:
      return [
        {
          name: typeScript.typeToMemberOrParameterName(tagParameter.type_),
          document: "",
          typeExpr: typeScript.typeToGeneratorType(tagParameter.type_)
        }
      ];
    case type.TagParameter_.Nothing:
      return [];
  }
};

const tagFunctionStatement = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter,
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): ReadonlyArray<generator.expr.Statement> => {
  console.log("customTypeName", customTypeName);
  console.log("tagNameAndParameter.name", tagNameAndParameter.name);

  const tagField: [string, generator.expr.Expr] = [
    "_",
    typeScript.exprEnum(
      customTypeName,
      tagNameAndParameter.name,
      customTypeDictionary
    )
  ];

  switch (tagNameAndParameter.parameter._) {
    case type.TagParameter_.Just:
      return [
        generator.expr.returnStatement(
          generator.expr.objectLiteral(
            new Map([
              tagField,
              [
                typeScript.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.type_
                ),
                generator.expr.localVariable([
                  typeScript.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.type_
                  )
                ])
              ]
            ])
          )
        )
      ];
    case type.TagParameter_.Nothing:
      return [
        generator.expr.returnStatement(
          generator.expr.objectLiteral(new Map([tagField]))
        )
      ];
  }
};
