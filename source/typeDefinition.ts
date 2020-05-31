import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "./type";
import { Type, Maybe, CustomTypeDefinitionBody } from "./type";
import * as util from "./util";
import * as c from "./case";
import * as codec from "./kernel/codec";
import * as maybe from "./kernel/maybe";
import * as result from "./kernel/result";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idOrTokenTypeNameSet: type.IdAndTokenNameSet,
  widthKernel: boolean
): ReadonlyArray<ts.TypeAlias> => {
  if (widthKernel) {
    return [
      codec.codecTypeDefinition(),
      customTypeToDefinition(maybe.customTypeDefinition),
      customTypeToDefinition(result.customTypeDefinition),
      ...customTypeList.map(customTypeToDefinition),
      ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(
        idOrTokenDefinition
      ),
    ];
  }
  return [
    ...customTypeList.map(customTypeToDefinition),
    ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(
      idOrTokenDefinition
    ),
  ];
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
  body: type.CustomTypeDefinitionBody
): ts.Type => {
  switch (body._) {
    case "Sum":
      if (type.isTagTypeAllNoParameter(body.patternList)) {
        return ts.typeUnion(
          body.patternList.map((pattern) => ts.typeStringLiteral(pattern.name))
        );
      }
      return ts.typeUnion(
        body.patternList.map((pattern) => patternListToObjectType(pattern))
      );
    case "Product":
      return ts.typeObject(
        new Map(
          body.memberList.map((member) => [
            member.name,
            {
              type_: util.typeToTypeScriptType(member.type),
              document: member.description,
            },
          ])
        )
      );
  }
};

const patternListToObjectType = (patternList: type.Pattern): ts.Type => {
  const tagField: [string, { type_: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: ts.typeStringLiteral(patternList.name),
    },
  ];

  switch (patternList.parameter._) {
    case "Just":
      return ts.typeObject(
        new Map([
          tagField,
          [
            util.typeToMemberOrParameterName(patternList.parameter.value),
            {
              document: "",
              type_: util.typeToTypeScriptType(patternList.parameter.value),
            },
          ],
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};
