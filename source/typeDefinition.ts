import * as codec from "./kernel/codec";
import * as data from "./data";
import * as hexString from "./kernel/hexString";
import * as maybe from "./kernel/maybe";
import * as result from "./kernel/result";
import * as util from "./util";
import { identifer, data as ts } from "js-ts-code-generator";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<data.CustomTypeDefinition>,
  idOrTokenTypeNameSet: util.IdAndTokenNameSet
): ReadonlyArray<ts.TypeAlias> => {
  return [
    codec.codecTypeDefinition(),
    customTypeToDefinition(maybe.customTypeDefinition),
    customTypeToDefinition(result.customTypeDefinition),
    ...customTypeList.map(customTypeToDefinition),
    ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(
      hexString.typeDefinition
    ),
  ];
};

/*
 * ========================================
 *             Custom Type
 * ========================================
 */

export const customTypeToDefinition = (
  customType: data.CustomTypeDefinition
): ts.TypeAlias => ({
  name: identifer.fromString(customType.name),
  document: customType.description,
  parameterList: customType.typeParameterList.map(identifer.fromString),
  type: customTypeDefinitionBodyToTsType(customType.body),
});

const customTypeDefinitionBodyToTsType = (
  body: data.CustomTypeDefinitionBody
): ts.Type => {
  switch (body._) {
    case "Sum":
      if (util.isTagTypeAllNoParameter(body.patternList)) {
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
              type: util.typeToTypeScriptType(member.type),
              document: member.description,
            },
          ])
        )
      );
  }
};

const patternListToObjectType = (patternList: data.Pattern): ts.Type => {
  const tagField: [string, { type: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type: ts.typeStringLiteral(patternList.name),
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
              type: util.typeToTypeScriptType(patternList.parameter.value),
            },
          ],
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};
