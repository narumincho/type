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
  checkCustomTypeListValidation(customTypeList);
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList, idOrTokenTypeNameSet)
        .map(data.definitionTypeAlias),
      // ...tag.generate(customTypeList),
      // ...encoder.generateCode(customTypeList).map(data.definitionFunction),
      // ...decoder.generateCode(customTypeList).map(data.definitionFunction),
    ],
    statementList: [],
  };
};

export const generateElmCode = (
  moduleName: string,
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): string => {
  checkCustomTypeListValidation(customTypeList);
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return elm.generateCode(moduleName, customTypeList, idOrTokenTypeNameSet);
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
  customTypeBody: type.CustomTypeBody,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  switch (customTypeBody._) {
    case "Product":
      checkProductTypeValidation(
        customTypeBody.memberNameAndTypeList,
        customTypeNameAndTypeParameterListMap,
        scopedTypeParameterList
      );
      return;
    case "Sum":
      checkSumTypeValidation(
        customTypeBody.tagNameAndParameterList,
        customTypeNameAndTypeParameterListMap,
        scopedTypeParameterList
      );
      return;
  }
};

const checkProductTypeValidation = (
  memberNameAndTypeList: ReadonlyArray<type.MemberNameAndType>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const memberNameSet: Set<string> = new Set();
  for (const memberNameAndType of memberNameAndTypeList) {
    if (memberNameSet.has(memberNameAndType.name)) {
      throw new Error("duplicate member name. name =" + memberNameAndType.name);
    }
    memberNameSet.add(memberNameAndType.name);

    if (!c.isFirstLowerCaseName(memberNameAndType.name)) {
      throw new Error(
        "member name is invalid. name =" + memberNameAndType.name
      );
    }
    checkTypeValidation(
      memberNameAndType.memberType,
      customTypeNameAndTypeParameterListMap,
      scopedTypeParameterList
    );
  }
};

const checkSumTypeValidation = (
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>,
  customTypeNameAndTypeParameterListMap: Map<string, Set<string>>,
  scopedTypeParameterList: Set<string>
): void => {
  const tagNameSet: Set<string> = new Set();
  for (const tagNameAndParameter of tagNameAndParameterList) {
    if (tagNameSet.has(tagNameAndParameter.name)) {
      throw new Error("duplicate tag name. name =" + tagNameAndParameter.name);
    }
    tagNameSet.add(tagNameAndParameter.name);

    if (!c.isFirstUpperCaseName(tagNameAndParameter.name)) {
      throw new Error("tag name is invalid. name =" + tagNameAndParameter.name);
    }
    if (tagNameAndParameter.parameter._ === "Just") {
      checkTypeValidation(
        tagNameAndParameter.parameter.value,
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
        type_.resultType.ok,
        customTypeNameAndTypeParameterMap,
        scopedTypeParameterList
      );
      checkTypeValidation(
        type_.resultType.error,
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
        type_.customType.name
      );
      if (customTypeTypeParameterList === undefined) {
        throw new Error(
          "custom type " + type_.customType.name + " is not defined."
        );
      }
      if (
        customTypeTypeParameterList.size !==
        type_.customType.parameterList.length
      ) {
        throw new Error(
          "type parameter count error. " +
            type_.customType.name +
            " need " +
            customTypeTypeParameterList.size.toString() +
            " parameter(s). but you specified " +
            type_.customType.parameterList.length.toString() +
            " parameter(s)"
        );
      }
      for (const parameter of type_.customType.parameterList) {
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
