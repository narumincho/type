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
    ),
    ...customTypeListToTagList(customTypeList)
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

const customTypeListToTagList = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.Definition> => {
  const result: Array<data.Definition> = [];
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
        const definitionList = productTypeToTagList(
          customType.name,
          customType.body.tagNameAndParameterArray
        );
        for (const definition of definitionList) {
          result.push(definition);
        }
      }
    }
  }
  return result;
};

const productTypeToTagList = (
  customTypeName: string,
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyArray<data.Definition> => {
  return tagNameAndParameterList.map(tagNameAndParameter =>
    tagNameAndParameterToTag(customTypeName, tagNameAndParameter)
  );
};

const tagNameAndParameterToTag = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter
): data.Definition => {
  const tagField: [string, data.Expr] = [
    "_",
    data.stringLiteral(tagNameAndParameter.name)
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return data.definitionFunction({
        name: generator.identifer.fromString(
          c.firstLowerCase(customTypeName) +
            c.firstUpperCase(tagNameAndParameter.name)
        ),
        document: tagNameAndParameter.description,
        parameterList: [
          {
            name: typeScript.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            document: "",
            type_: typeScript.typeToGeneratorType(
              tagNameAndParameter.parameter.value
            )
          }
        ],
        typeParameterList: [],
        returnType: data.typeScopeInFile(
          generator.identifer.fromString(customTypeName)
        ),
        statementList: [
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
        ]
      });

    case "Nothing":
      return data.definitionVariable({
        name: generator.identifer.fromString(
          c.firstLowerCase(customTypeName) +
            c.firstUpperCase(tagNameAndParameter.name)
        ),
        document: tagNameAndParameter.description,
        type_: data.typeScopeInFile(
          generator.identifer.fromString(customTypeName)
        ),
        expr: data.objectLiteral(new Map([tagField]))
      });
  }
};
