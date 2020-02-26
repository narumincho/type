import * as generator from "js-ts-code-generator";
import * as type from "../type";
import * as c from "../case";
import * as typeScript from "../typeScript";
import * as e from "../binaryConverter/typeScript/encoder";

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
    exportFunctionMap: new Map([
      ...customTypeDictionaryToTagFunctionList(customTypeDictionary),
      ...e.generateCode(customTypeDictionary)
    ]),
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
        isProductTypeAllNoParameter(customType.body.tagNameAndParameterArray)
      ) {
        return {
          typeAlias: null,
          enum: [
            typeScript.customTypeToTypeName(customTypeName),
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
              (tagNameAndParameter, index) => [tagNameAndParameter.name, index]
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
      c.firstLowerCase(typeScript.customTypeToTypeName(customTypeName)) +
        c.firstUpperCase(tagNameAndParameter.name),
      {
        document: tagNameAndParameter.description,
        parameterList: tagFunctionParameter(tagNameAndParameter.parameter),
        returnType: generator.typeExpr.globalType(
          typeScript.customTypeToTypeName(customTypeName)
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
  tagNameAndParameter: type.TagNameAndParameter
): ReadonlyArray<generator.expr.Statement> => {
  const tagField: [string, generator.expr.Expr] = [
    "_",
    generator.expr.enumTag(
      typeScript.customTypeNameToEnumName(customTypeName),
      typeScript.tagNameToEnumTag(tagNameAndParameter.name)
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

const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    tagNameAndParameter =>
      tagNameAndParameter.parameter._ === type.TagParameter_.Nothing
  );
