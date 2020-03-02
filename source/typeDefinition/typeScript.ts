import * as generator from "js-ts-code-generator";
import { data } from "js-ts-code-generator";
import * as type from "../type";
import * as c from "../case";
import * as typeScript from "../typeScript";

export const generateCode = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.Definition> => {
  return [
    data.definitionTypeAlias(maybeDefinition),
    data.definitionTypeAlias(resultDefinition),
    ...customTypeList.map(customType =>
      data.definitionTypeAlias(customTypeToDefinition(customType))
    )
  ];
};

const maybeDefinition: data.TypeAlias = {
  name: generator.identifer.fromString("Maybe"),
  document: "Maybe",
  parameterList: [generator.identifer.fromString("T")],
  type_: data.typeUnion([
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Just"), document: "" }],
        [
          "value",
          {
            type_: data.typeScopeInFile(generator.identifer.fromString("T")),
            document: ""
          }
        ]
      ])
    ),
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Nothing"), document: "" }]
      ])
    )
  ])
};

const resultDefinition: data.TypeAlias = {
  name: generator.identifer.fromString("Result"),
  document: "Result",
  parameterList: [
    generator.identifer.fromString("ok"),
    generator.identifer.fromString("error")
  ],
  type_: data.typeUnion([
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Ok"), document: "" }],
        [
          "ok",
          {
            type_: data.typeScopeInFile(generator.identifer.fromString("ok")),
            document: ""
          }
        ]
      ])
    ),
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Error"), document: "" }],
        [
          "error",
          {
            type_: data.typeScopeInFile(
              generator.identifer.fromString("error")
            ),
            document: ""
          }
        ]
      ])
    )
  ])
};

export const customTypeToDefinition = (
  customType: type.CustomType
): data.TypeAlias => {
  switch (customType.body._) {
    case "Sum":
      if (
        typeScript.isProductTypeAllNoParameter(
          customType.body.tagNameAndParameterArray
        )
      ) {
        return {
          name: generator.identifer.fromString(customType.name),
          document: customType.description,
          parameterList: [],
          type_: data.typeUnion(
            customType.body.tagNameAndParameterArray.map(tagNameAndParameter =>
              data.typeStringLiteral(tagNameAndParameter.name)
            )
          )
        };
      }
      return {
        name: generator.identifer.fromString(customType.name),
        document: customType.description,
        parameterList: [],
        type_: data.typeUnion(
          customType.body.tagNameAndParameterArray.map(tagNameAndParameter =>
            tagNameAndParameterToObjectType(tagNameAndParameter)
          )
        )
      };
    case "Product":
      return {
        name: generator.identifer.fromString(customType.name),
        document: customType.description,
        parameterList: [],
        type_: data.typeObject(
          new Map(
            customType.body.memberNameAndTypeArray.map(memberNameAndType => [
              memberNameAndType.name,
              {
                type_: typeScript.typeToGeneratorType(
                  memberNameAndType.memberType
                ),
                document: memberNameAndType.description
              }
            ])
          )
        )
      };
  }
};

const tagNameAndParameterToObjectType = (
  tagNameAndParameter: type.TagNameAndParameter
): data.Type => {
  const tagField: [string, { type_: data.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: data.typeStringLiteral(tagNameAndParameter.name)
    }
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return data.typeObject(
        new Map([
          tagField,
          [
            typeScript.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            {
              document: "",
              type_: typeScript.typeToGeneratorType(
                tagNameAndParameter.parameter.value
              )
            }
          ]
        ])
      );
    case "Nothing":
      return data.typeObject(new Map([tagField]));
  }
};

const customTypeListToTagFunctionList = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.Function> => {
  const result: Array<data.Function> = [];
  for (const customType of customTypeList) {
    switch (customType.body._) {
      case "Sum": {
        if (
          typeScript.isProductTypeAllNoParameter(
            customType.body.tagNameAndParameterArray
          )
        ) {
          break;
        }
        const functionList = productTypeToTagFunctionList(
          customType.name,
          customType.body.tagNameAndParameterArray
        );
        for (const func of functionList) {
          result.push(func);
        }
      }
    }
  }
  return result;
};

const productTypeToTagFunctionList = (
  customTypeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyArray<data.Function> => {
  const result: Array<data.Function> = [];

  for (const tagNameAndParameter of tagNameAndParameterArray) {
    result.push({
      name: generator.identifer.fromString(
        c.firstLowerCase(customTypeName) +
          c.firstUpperCase(tagNameAndParameter.name)
      ),
      document: tagNameAndParameter.description,
      parameterList: tagFunctionParameter(tagNameAndParameter.parameter),
      typeParameterList: [],
      returnType: data.typeScopeInFile(
        generator.identifer.fromString(customTypeName)
      ),
      statementList: tagFunctionStatement(tagNameAndParameter)
    });
  }

  return result;
};

const tagFunctionParameter = (
  tagParameter: type.Maybe<type.Type>
): ReadonlyArray<{
  readonly name: generator.identifer.Identifer;
  readonly document: string;
  readonly type_: data.Type;
}> => {
  switch (tagParameter._) {
    case "Just":
      return [
        {
          name: typeScript.typeToMemberOrParameterName(tagParameter.value),
          document: "",
          type_: typeScript.typeToGeneratorType(tagParameter.value)
        }
      ];
    case "Nothing":
      return [];
  }
};

const tagFunctionStatement = (
  tagNameAndParameter: type.TagNameAndParameter
): ReadonlyArray<data.Statement> => {
  const tagField: [string, data.Expr] = [
    "_",
    data.stringLiteral(tagNameAndParameter.name)
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return [
        data.statementReturn(
          data.objectLiteral(
            new Map([
              tagField,
              [
                typeScript.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.value
                ),
                data.variable(
                  typeScript.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  )
                )
              ]
            ])
          )
        )
      ];
    case "Nothing":
      return [data.statementReturn(data.objectLiteral(new Map([tagField])))];
  }
};
