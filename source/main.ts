import * as elm from "./elm";
import * as typeDefinition from "./typeScript/typeDefinition";
import * as encoder from "./typeScript/encoder";
import * as decoder from "./typeScript/decoder";
import * as tag from "./typeScript/tag";
import * as type from "./type";
import { data } from "js-ts-code-generator";
import * as c from "./case";

export { type };

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): data.Code => {
  validCustomTypeList(customTypeList);
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList, idOrTokenTypeNameSet)
        .map(data.definitionTypeAlias),
      ...tag.generate(customTypeList),
      ...encoder.generateCode(customTypeList).map(data.definitionFunction),
      ...decoder.generateCode(customTypeList).map(data.definitionFunction),
    ],
    statementList: [],
  };
};

export const generateElmCode = (
  moduleName: string,
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): string => {
  validCustomTypeList(customTypeList);
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return elm.generateCode(moduleName, customTypeList, idOrTokenTypeNameSet);
};

const validCustomTypeList = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): void => {
  for (const customType of customTypeList) {
    validCustomType(customType);
  }
};

const validCustomType = (customType: type.CustomTypeDefinition): void => {
  if (!c.isFirstUpperCaseName(customType.name)) {
    throw new Error("custom type name is invalid. name = " + customType.name);
  }
  switch (customType.body._) {
    case "Product":
      validProductType(customType.body.memberNameAndTypeList);
      return;
    case "Sum":
      validSumType(customType.body.tagNameAndParameterList);
      return;
  }
};

const validProductType = (
  memberNameAndTypeList: ReadonlyArray<type.MemberNameAndType>
): void => {
  const memberNameSet: Set<string> = new Set();
  for (const memberNameAndType of memberNameAndTypeList) {
    if (memberNameSet.has(memberNameAndType.name)) {
      throw new Error(
        "duplicate member name. member name =" + memberNameAndType.name
      );
    }
    memberNameSet.add(memberNameAndType.name);

    if (!c.isFirstLowerCaseName(memberNameAndType.name)) {
      throw new Error(
        "member name is invalid. member name =" + memberNameAndType.name
      );
    }
  }
};

const validSumType = (
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): void => {
  const tagNameSet: Set<string> = new Set();
  for (const tagNameAndParameter of tagNameAndParameterList) {
    if (tagNameSet.has(tagNameAndParameter.name)) {
      throw new Error(
        "duplicate tag name. tag name =" + tagNameAndParameter.name
      );
    }
    tagNameSet.add(tagNameAndParameter.name);

    if (!c.isFirstUpperCaseName(tagNameAndParameter.name)) {
      throw new Error(
        "tag name is invalid. tag name =" + tagNameAndParameter.name
      );
    }
  }
};
