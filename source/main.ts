import * as typeDefinition from "./typeScript/typeDefinition";
import * as tag from "./typeScript/tag";
import * as type from "./type";
import { data } from "js-ts-code-generator";
import * as c from "./case";

export { type };

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): data.Code => {
  checkCustomTypeListValidation(customTypeList);
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList, idOrTokenTypeNameSet)
        .map(data.definitionTypeAlias),
      ...tag
        .generate(customTypeList, idOrTokenTypeNameSet)
        .map(data.definitionVariable),
    ],
    statementList: [],
  };
};

/**
 * 指定した型の定義が正しくできているか調べる
 * Elmの予約語判定はここではやらない
 * @throws 型の定義が正しくできていない場合
 */
const checkCustomTypeListValidation = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): void => {
  const customTypeNameAndTypeParameterListMap: Map<
    string,
    Set<string>
  > = new Map();
  for (const customType of customTypeList) {
    if (!c.isFirstUpperCaseName(customType.name)) {
      throw new Error("custom type name is invalid. name = " + customType.name);
    }
    if (customTypeNameAndTypeParameterListMap.has(customType.name)) {
      throw new Error("duplicate custom type name. name =" + customType.name);
    }

    const typeParameterSet: Set<string> = new Set();
    for (const typeParameter of customType.typeParameterList) {
      if (typeParameterSet.has(typeParameter)) {
        throw new Error(
          "duplicate type parameter name. name =" + typeParameter
        );
      }
      typeParameterSet.add(typeParameter);
      if (!c.isFirstLowerCaseName(typeParameter)) {
        throw new Error(
          "type parameter name is invalid. name =" + typeParameter
        );
      }
    }
    customTypeNameAndTypeParameterListMap.set(
      customType.name,
      typeParameterSet
    );
  }

  for (const customType of customTypeList) {
    const scopedTypeParameterList = customTypeNameAndTypeParameterListMap.get(
      customType.name
    );
    if (scopedTypeParameterList === undefined) {
      throw new Error("internal error. fail collect custom type");
    }

    checkCustomTypeBodyValidation(
      customType.body,
      customTypeNameAndTypeParameterListMap,
      scopedTypeParameterList
    );
  }
};

const checkCustomTypeBodyValidation = (
  customTypeBody: type.CustomTypeDefinitionBody,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  switch (customTypeBody._) {
    case "Product":
      checkProductTypeValidation(
        customTypeBody.memberList,
        customTypeNameAndTypeParameterListMap,
        scopedTypeParameterList
      );
      return;
    case "Sum":
      checkSumTypeValidation(
        customTypeBody.patternList,
        customTypeNameAndTypeParameterListMap,
        scopedTypeParameterList
      );
      return;
  }
};

const checkProductTypeValidation = (
  memberList: ReadonlyArray<type.Member>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const memberNameSet: Set<string> = new Set();
  for (const member of memberList) {
    if (memberNameSet.has(member.name)) {
      throw new Error("duplicate member name. name =" + member.name);
    }
    memberNameSet.add(member.name);

    if (!c.isFirstLowerCaseName(member.name)) {
      throw new Error("member name is invalid. name =" + member.name);
    }
    checkTypeValidation(
      member.type,
      customTypeNameAndTypeParameterListMap,
      scopedTypeParameterList
    );
  }
};

const checkSumTypeValidation = (
  patternList: ReadonlyArray<type.Pattern>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const tagNameSet: Set<string> = new Set();
  for (const pattern of patternList) {
    if (tagNameSet.has(pattern.name)) {
      throw new Error("duplicate tag name. name =" + pattern.name);
    }
    tagNameSet.add(pattern.name);

    if (!c.isFirstUpperCaseName(pattern.name)) {
      throw new Error("tag name is invalid. name =" + pattern.name);
    }
    if (pattern.parameter._ === "Just") {
      checkTypeValidation(
        pattern.parameter.value,
        customTypeNameAndTypeParameterListMap,
        scopedTypeParameterList
      );
    }
  }
};

const checkTypeValidation = (
  type_: type.Type,
  customTypeNameAndTypeParameterMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  switch (type_._) {
    case "List":
    case "Maybe":
      checkTypeValidation(
        type_.type_,
        customTypeNameAndTypeParameterMap,
        scopedTypeParameterList
      );
      return;
    case "Result":
      checkTypeValidation(
        type_.okAndErrorType.ok,
        customTypeNameAndTypeParameterMap,
        scopedTypeParameterList
      );
      checkTypeValidation(
        type_.okAndErrorType.error,
        customTypeNameAndTypeParameterMap,
        scopedTypeParameterList
      );
      return;
    case "Id":
      if (!c.isFirstUpperCaseName(type_.string_)) {
        throw new Error("Id type name is invalid. name =" + type_.string_);
      }
      return;
    case "Token":
      if (!c.isFirstUpperCaseName(type_.string_)) {
        throw new Error("Token type name is invalid. name =" + type_.string_);
      }
      return;
    case "Custom": {
      const customTypeTypeParameterList = customTypeNameAndTypeParameterMap.get(
        type_.nameAndTypeParameterList.name
      );
      if (customTypeTypeParameterList === undefined) {
        throw new Error(
          "custom type " +
            type_.nameAndTypeParameterList.name +
            " is not defined."
        );
      }
      if (
        customTypeTypeParameterList.size !==
        type_.nameAndTypeParameterList.parameterList.length
      ) {
        throw new Error(
          "type parameter count error. " +
            type_.nameAndTypeParameterList.name +
            " need " +
            customTypeTypeParameterList.size.toString() +
            " parameter(s). but you specified " +
            type_.nameAndTypeParameterList.parameterList.length.toString() +
            " parameter(s)"
        );
      }
      for (const parameter of type_.nameAndTypeParameterList.parameterList) {
        checkTypeValidation(
          parameter,
          customTypeNameAndTypeParameterMap,
          scopedTypeParameterList
        );
      }
      return;
    }
    case "Parameter":
      if (!scopedTypeParameterList.has(type_.string_)) {
        throw new Error("type parameter " + type_.string_ + " is not defined.");
      }
  }
};
