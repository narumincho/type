import { data, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as typeScript from "../typeScript";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.TypeAlias> => {
  return [
    maybeDefinition,
    resultDefinition,
    ...customTypeList.map(customType => customTypeToDefinition(customType))
  ];
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeName = identifer.fromString("Maybe");
export const maybeVar = (elementType: data.Type): data.Type =>
  data.typeWithParameter(data.typeScopeInFile(maybeName), [elementType]);

const maybeDefinition: data.TypeAlias = {
  name: maybeName,
  document: "Maybe",
  parameterList: [identifer.fromString("T")],
  type_: data.typeUnion([
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Just"), document: "" }],
        [
          "value",
          {
            type_: data.typeScopeInFile(identifer.fromString("T")),
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

/* ========================================
                  Result
   ========================================
*/

const resultName = identifer.fromString("Result");
export const resultVar = (okType: data.Type, errorType: data.Type): data.Type =>
  data.typeWithParameter(data.typeScopeInFile(resultName), [okType, errorType]);

const resultDefinition: data.TypeAlias = {
  name: resultName,
  document: "Result",
  parameterList: [identifer.fromString("ok"), identifer.fromString("error")],
  type_: data.typeUnion([
    data.typeObject(
      new Map([
        ["_", { type_: data.typeStringLiteral("Ok"), document: "" }],
        [
          "ok",
          {
            type_: data.typeScopeInFile(identifer.fromString("ok")),
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
            type_: data.typeScopeInFile(identifer.fromString("error")),
            document: ""
          }
        ]
      ])
    )
  ])
};

/* ========================================
               Custom Type
   ========================================
*/
const customTypeNameIdentifer = (customTypeName: string): identifer.Identifer =>
  identifer.fromString(customTypeName);

export const customTypeVar = (customTypeName: string): data.Type =>
  data.typeScopeInFile(customTypeNameIdentifer(customTypeName));

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
          name: identifer.fromString(customType.name),
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
        name: identifer.fromString(customType.name),
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
        name: customTypeNameIdentifer(customType.name),
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
