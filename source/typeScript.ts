import * as generator from "js-ts-code-generator";
import * as type from "./type";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): generator.Code => {
  const result: {
    readonly exportTypeAliasMap: Map<string, generator.ExportTypeAlias>;
    readonly exportConstEnumMap: Map<
      string,
      generator.type.ExportConstEnumTagNameAndValueList
    >;
    readonly exportFunctionMap: Map<string, generator.ExportFunction>;
    readonly statementList: ReadonlyArray<generator.expr.Statement>;
  } = {
    exportTypeAliasMap: new Map(),
    exportConstEnumMap: new Map(),
    exportFunctionMap: new Map(),
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
        customType.body.tagNameAndParameterArray.every(
          tagNameAndParameter =>
            tagNameAndParameter.parameter._ === type.TagParameter_.Nothing
        )
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
        firstUpperCase(typeToMemberName(type_.dictionaryType.value)) +
        "Dictionary"
      );
    case type.Type_.Set:
      return typeToMemberName(type_.type_) + "Set";
    case type.Type_.Custom: {
      const name = firstLowerCase(type_.string_);
      return generator.identifer.isIdentifer(name) ? name : name + "_";
    }
  }
};

const firstUpperCase = (text: string): string =>
  text.substring(0, 1).toUpperCase() + text.substring(1);

const firstLowerCase = (text: string): string =>
  text.substring(0, 1).toLowerCase() + text.substring(1);

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

const idTypeName = (customTypeName: string): string => customTypeName + "Id";

const hashTypeName = (customTypeName: string): string =>
  customTypeName + "Hash";

const customTypeToTypeName = (customTypeName: string): string =>
  firstUpperCase(customTypeName);
