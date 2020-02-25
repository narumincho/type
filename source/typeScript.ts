import * as generator from "js-ts-code-generator";
import * as type from "./type";
import * as c from "./case";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): generator.Code => {
  const result: {
    readonly exportTypeAliasMap: Map<string, generator.ExportTypeAlias>;
    readonly exportConstEnumMap: Map<
      string,
      generator.type.ExportConstEnumTagNameAndValueList
    >;
    readonly exportFunctionMap: ReadonlyMap<string, generator.ExportFunction>;
    readonly statementList: ReadonlyArray<generator.expr.Statement>;
  } = {
    exportTypeAliasMap: new Map(),
    exportConstEnumMap: new Map(),
    exportFunctionMap: customTypeDictionaryToTagFunctionList(
      customTypeDictionary
    ),
    statementList: []
  };
  for (const customType of customTypeDictionary.entries()) {
    const definition = toTypeAliasAndEnum(customType);
    if (definition.typeAlias !== null) {
      result.exportTypeAliasMap.set(
        definition.typeAlias[0],
        definition.typeAlias[1]
      );
    }
    if (definition.enum !== null) {
      result.exportConstEnumMap.set(definition.enum[0], definition.enum[1]);
    }
  }
  return result;
};

const toTypeAliasAndEnum = ([customTypeName, customType]: [
  string,
  type.CustomType
]): {
  typeAlias: [string, generator.ExportTypeAlias] | null;
  enum: [string, generator.type.ExportConstEnumTagNameAndValueList] | null;
} => {
  switch (customType.body._) {
    case type.CustomType_.Product:
      if (
        isProductTypeAllNoParameter(customType.body.tagNameAndParameterArray)
      ) {
        return {
          typeAlias: null,
          enum: [
            customTypeToTypeName(customTypeName),
            new Map(
              customType.body.tagNameAndParameterArray.map(
                (tagNameAndParameter, index) => [
                  tagNameAndParameter.name,
                  index
                ]
              )
            )
          ]
        };
      }
      return {
        typeAlias: [
          customTypeToTypeName(customTypeName),
          {
            document: customType.description,
            typeExpr: generator.typeExpr.union(
              customType.body.tagNameAndParameterArray.map(
                tagNameAndParameter =>
                  tagNameAndParameterToObjectType(
                    customTypeNameToEnumName(customTypeName),
                    tagNameAndParameter
                  )
              )
            )
          }
        ],
        enum: [
          customTypeNameToEnumName(customTypeName),
          new Map(
            customType.body.tagNameAndParameterArray.map(
              (tagNameAndParameter, index) => [tagNameAndParameter.name, index]
            )
          )
        ]
      };
    case type.CustomType_.Sum:
      return {
        typeAlias: [
          customTypeToTypeName(customTypeName),
          {
            document: customType.description,
            typeExpr: generator.typeExpr.object(
              new Map(
                customType.body.memberNameAndTypeArray.map(
                  memberNameAndType => [
                    memberNameAndType.name,
                    {
                      typeExpr: typeToGeneratorType(
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

const customTypeNameToEnumName = (customTypeName: string): string =>
  customTypeToTypeName(customTypeName) + "_";

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
        tagNameAndParameter.name
      )
    }
  ];

  switch (tagNameAndParameter.parameter._) {
    case type.TagParameter_.Just:
      return generator.typeExpr.object(
        new Map([
          tagField,
          [
            typeToMemberName(tagNameAndParameter.parameter.type_),
            {
              document: "",
              typeExpr: typeToGeneratorType(tagNameAndParameter.parameter.type_)
            }
          ]
        ])
      );
    case type.TagParameter_.Nothing:
      return generator.typeExpr.object(new Map([tagField]));
  }
};

const typeToGeneratorType = (type_: type.Type): generator.typeExpr.TypeExpr => {
  switch (type_._) {
    case type.Type_.UInt32:
      return generator.typeExpr.typeNumber;
    case type.Type_.String:
      return generator.typeExpr.typeString;
    case type.Type_.Id:
      return generator.typeExpr.globalType(
        idTypeName(customTypeToTypeName(type_.string_))
      );
    case type.Type_.Hash:
      return generator.typeExpr.globalType(
        hashTypeName(customTypeToTypeName(type_.string_))
      );
    case type.Type_.List:
      return generator.typeExpr.withTypeParameter(
        generator.typeExpr.globalType("ReadonlyArray"),
        [typeToGeneratorType(type_.type_)]
      );
    case type.Type_.Dictionary:
      return generator.typeExpr.withTypeParameter(
        generator.typeExpr.globalType("Map"),
        [
          typeToGeneratorType(type_.dictionaryType.key),
          typeToGeneratorType(type_.dictionaryType.value)
        ]
      );
    case type.Type_.Set:
      return generator.typeExpr.withTypeParameter(
        generator.typeExpr.globalType("Set"),
        [typeToGeneratorType(type_.type_)]
      );
    case type.Type_.Custom:
      return generator.typeExpr.globalType(customTypeToTypeName(type_.string_));
  }
};

const typeToMemberName = (type_: type.Type): string => {
  switch (type_._) {
    case type.Type_.UInt32:
      return "uInt32";
    case type.Type_.String:
      return "string_";
    case type.Type_.Id:
      return customTypeToTypeName(type_.string_) + "Id";
    case type.Type_.Hash:
      return customTypeToTypeName(type_.string_) + "Hash";
    case type.Type_.List:
      return typeToMemberName(type_.type_) + "List";
    case type.Type_.Dictionary:
      return (
        typeToMemberName(type_.dictionaryType.key) +
        c.firstUpperCase(typeToMemberName(type_.dictionaryType.value)) +
        "Dictionary"
      );
    case type.Type_.Set:
      return typeToMemberName(type_.type_) + "Set";
    case type.Type_.Custom: {
      const name = c.firstLowerCase(type_.string_);
      return generator.identifer.isIdentifer(name) ? name : name + "_";
    }
  }
};

const customTypeDictionaryToTagFunctionList = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): ReadonlyMap<string, generator.ExportFunction> => {
  const result = new Map<string, generator.ExportFunction>();
  for (const [customTypeName, customType] of customTypeDictionary.entries()) {
    switch (customType.body._) {
      case type.CustomType_.Product: {
        if (
          isProductTypeAllNoParameter(customType.body.tagNameAndParameterArray)
        ) {
          break;
        }
        const functionList = productTypeToTagFunctionList(
          customTypeName,
          customType.body.tagNameAndParameterArray
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
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyMap<string, generator.ExportFunction> => {
  const result = new Map<string, generator.ExportFunction>();

  for (const tagNameAndParameter of tagNameAndParameterArray) {
    result.set(
      c.firstLowerCase(customTypeToTypeName(customTypeName)) +
        c.firstUpperCase(tagNameAndParameter.name),
      {
        document: tagNameAndParameter.description,
        parameterList: tagFunctionParameter(tagNameAndParameter.parameter),
        returnType: generator.typeExpr.globalType(
          customTypeToTypeName(customTypeName)
        ),
        statementList: tagFunctionStatement(customTypeName, tagNameAndParameter)
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
          name: typeToMemberName(tagParameter.type_),
          document: "",
          typeExpr: typeToGeneratorType(tagParameter.type_)
        }
      ];
    case type.TagParameter_.Nothing:
      return [];
  }
};

const tagFunctionStatement = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter
): ReadonlyArray<generator.expr.Statement> => {
  const tagField: [string, generator.expr.Expr] = [
    "_",
    generator.expr.enumTag(
      customTypeNameToEnumName(customTypeName),
      tagNameAndParameter.name
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
                typeToMemberName(tagNameAndParameter.parameter.type_),
                generator.expr.localVariable([
                  typeToMemberName(tagNameAndParameter.parameter.type_)
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

const idTypeName = (customTypeName: string): string => customTypeName + "Id";

const hashTypeName = (customTypeName: string): string =>
  customTypeName + "Hash";

const customTypeToTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName);

const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    tagNameAndParameter =>
      tagNameAndParameter.parameter._ === type.TagParameter_.Nothing
  );
