import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idOrTokenTypeNameSet: Set<string>
): ReadonlyArray<ts.TypeAlias> => {
  return [
    maybeDefinition,
    resultDefinition,
    ...customTypeList.map(customTypeToDefinition),
    ...[...idOrTokenTypeNameSet].map(idOrTokenDefinition),
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
  parameterList: [identifer.fromString("value")],
  type_: ts.typeUnion([
    ts.typeObject(
      new Map([
        ["_", { type_: ts.typeStringLiteral("Just"), document: "" }],
        [
          "value",
          {
            type_: ts.typeScopeInFile(identifer.fromString("value")),
            document: "",
          },
        ],
      ])
    ),
    ts.typeObject(
      new Map([["_", { type_: ts.typeStringLiteral("Nothing"), document: "" }]])
    ),
  ]),
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
            document: "",
          },
        ],
      ])
    ),
    ts.typeObject(
      new Map([
        ["_", { type_: ts.typeStringLiteral("Error"), document: "" }],
        [
          "error",
          {
            type_: ts.typeScopeInFile(identifer.fromString("error")),
            document: "",
          },
        ],
      ])
    ),
  ]),
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
        ["_" + c.firstLowerCase(name), { type_: ts.typeNever, document: "" }],
      ])
    )
  ),
});

/* ========================================
               Custom Type
   ========================================
*/

export const customTypeToDefinition = (
  customType: type.CustomTypeDefinition
): ts.TypeAlias => ({
  name: identifer.fromString(customType.name),
  document: customType.description,
  parameterList: customType.typeParameterList.map(identifer.fromString),
  type_: customTypeDefinitionBodyToTsType(customType.body),
});

const customTypeDefinitionBodyToTsType = (
  body: type.CustomTypeBody
): ts.Type => {
  switch (body._) {
    case "Sum":
      if (type.isProductTypeAllNoParameter(body.tagNameAndParameterList)) {
        return ts.typeUnion(
          body.tagNameAndParameterList.map((tagNameAndParameter) =>
            ts.typeStringLiteral(tagNameAndParameter.name)
          )
        );
      }
      return ts.typeUnion(
        body.tagNameAndParameterList.map((tagNameAndParameter) =>
          tagNameAndParameterToObjectType(tagNameAndParameter)
        )
      );
    case "Product":
      return ts.typeObject(
        new Map(
          body.memberNameAndTypeList.map((memberNameAndType) => [
            memberNameAndType.name,
            {
              type_: util.typeToTypeScriptType(memberNameAndType.memberType),
              document: memberNameAndType.description,
            },
          ])
        )
      );
  }
};

const tagNameAndParameterToObjectType = (
  tagNameAndParameter: type.TagNameAndParameter
): ts.Type => {
  const tagField: [string, { type_: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: ts.typeStringLiteral(tagNameAndParameter.name),
    },
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
              type_: util.typeToTypeScriptType(
                tagNameAndParameter.parameter.value
              ),
            },
          ],
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};
