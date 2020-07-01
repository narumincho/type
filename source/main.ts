import * as data from "./data";
import * as tag from "./tag";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as typeDefinition from "./typeDefinition";
import * as util from "./util";

export { data };

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<data.CustomTypeDefinition>
): ts.Code => {
  checkCustomTypeListValidation(customTypeList);
  const idOrTokenTypeNameSet = util.collectIdOrTokenTypeNameSet(customTypeList);
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList, idOrTokenTypeNameSet)
        .map(ts.ExportDefinition.TypeAlias),
      ...tag
        .generate(customTypeList, idOrTokenTypeNameSet)
        .map(ts.ExportDefinition.Variable),
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
  customTypeList: ReadonlyArray<data.CustomTypeDefinition>
): void => {
  const customTypeNameAndTypeParameterListMap: Map<
    string,
    Set<string>
  > = new Map();
  for (const customType of customTypeList) {
    if (!util.isFirstUpperCaseName(customType.name)) {
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
      if (!util.isFirstLowerCaseName(typeParameter)) {
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
  customTypeBody: data.CustomTypeDefinitionBody,
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
  }
};

const checkProductTypeValidation = (
  memberList: ReadonlyArray<data.Member>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const memberNameSet: Set<string> = new Set();
  for (const member of memberList) {
    if (memberNameSet.has(member.name)) {
      throw new Error("duplicate member name. name =" + member.name);
    }
    memberNameSet.add(member.name);

    if (!util.isFirstLowerCaseName(member.name)) {
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
  patternList: ReadonlyArray<data.Pattern>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const tagNameSet: Set<string> = new Set();
  for (const pattern of patternList) {
    if (tagNameSet.has(pattern.name)) {
      throw new Error("duplicate tag name. name =" + pattern.name);
    }
    tagNameSet.add(pattern.name);

    if (!util.isFirstUpperCaseName(pattern.name)) {
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
  type_: data.Type,
  customTypeNameAndTypeParameterMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  switch (type_._) {
    case "List":
    case "Maybe":
      checkTypeValidation(
        type_.type,
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
      if (!util.isFirstUpperCaseName(type_.string)) {
        throw new Error("Id type name is invalid. name =" + type_.string);
      }
      return;
    case "Token": {
      if (!util.isFirstUpperCaseName(type_.string)) {
        throw new Error("Token type name is invalid. name =" + type_.string);
      }
      return;
    }
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
      if (!scopedTypeParameterList.has(type_.string)) {
        throw new Error("type parameter " + type_.string + " is not defined.");
      }
  }
};
