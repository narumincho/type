import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";

export const generateTypeDefinition = (
  schema: type.Schema
): ReadonlyArray<ts.TypeAlias> => {
  return [
    maybeDefinition,
    resultDefinition,
    ...schema.customTypeList.map(customTypeToDefinition),
    ...schema.idOrTokenTypeNameList.map(idOrTokenDefinition)
  ];
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeName = identifer.fromString("Maybe");
export const maybeVar = (elementType: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(maybeName), [elementType]);

const maybeDefinition: ts.TypeAlias = {
  name: maybeName,
  document: "Maybe",
  parameterList: [identifer.fromString("T")],
  type_: ts.typeUnion([
    ts.typeObject(
      new Map([
        ["_", { type_: ts.typeStringLiteral("Just"), document: "" }],
        [
          "value",
          {
            type_: ts.typeScopeInFile(identifer.fromString("T")),
            document: ""
          }
        ]
      ])
    ),
    ts.typeObject(
      new Map([["_", { type_: ts.typeStringLiteral("Nothing"), document: "" }]])
    )
  ])
};

/* ========================================
                  Result
   ========================================
*/

const resultName = identifer.fromString("Result");
export const resultVar = (okType: ts.Type, errorType: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(resultName), [okType, errorType]);

const resultDefinition: ts.TypeAlias = {
  name: resultName,
  document: "Result",
  parameterList: [identifer.fromString("ok"), identifer.fromString("error")],
  type_: ts.typeUnion([
    ts.typeObject(
      new Map([
        ["_", { type_: ts.typeStringLiteral("Ok"), document: "" }],
        [
          "ok",
          {
            type_: ts.typeScopeInFile(identifer.fromString("ok")),
            document: ""
          }
        ]
      ])
    ),
    ts.typeObject(
      new Map([
        ["_", { type_: ts.typeStringLiteral("Error"), document: "" }],
        [
          "error",
          {
            type_: ts.typeScopeInFile(identifer.fromString("error")),
            document: ""
          }
        ]
      ])
    )
  ])
};
/* ========================================
                Id Token
   ========================================
 */

const idOrTokenDefinition = (name: string): ts.TypeAlias => ({
  name: identifer.fromString(name),
  document: "",
  parameterList: [],
  type_: ts.typeIntersection(
    ts.typeString,
    ts.typeObject(
      new Map([
        ["_" + c.firstLowerCase(name), { type_: ts.typeNever, document: "" }]
      ])
    )
  )
});

/* ========================================
               Custom Type
   ========================================
*/
const customTypeNameIdentifer = (customTypeName: string): identifer.Identifer =>
  identifer.fromString(customTypeName);

export const customTypeVar = (customTypeName: string): ts.Type =>
  ts.typeScopeInFile(customTypeNameIdentifer(customTypeName));

export const customTypeToDefinition = (
  customType: type.CustomType
): ts.TypeAlias => {
  switch (customType.body._) {
    case "Sum":
      if (
        type.isProductTypeAllNoParameter(
          customType.body.tagNameAndParameterArray
        )
      ) {
        return {
          name: identifer.fromString(customType.name),
          document: customType.description,
          parameterList: [],
          type_: ts.typeUnion(
            customType.body.tagNameAndParameterArray.map(tagNameAndParameter =>
              ts.typeStringLiteral(tagNameAndParameter.name)
            )
          )
        };
      }
      return {
        name: identifer.fromString(customType.name),
        document: customType.description,
        parameterList: [],
        type_: ts.typeUnion(
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
        type_: ts.typeObject(
          new Map(
            customType.body.memberNameAndTypeArray.map(memberNameAndType => [
              memberNameAndType.name,
              {
                type_: util.typeToGeneratorType(memberNameAndType.memberType),
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
): ts.Type => {
  const tagField: [string, { type_: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: ts.typeStringLiteral(tagNameAndParameter.name)
    }
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.typeObject(
        new Map([
          tagField,
          [
            util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            {
              document: "",
              type_: util.typeToGeneratorType(
                tagNameAndParameter.parameter.value
              )
            }
          ]
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};
