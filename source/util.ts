import * as data from "./data";
import { identifer, data as ts } from "js-ts-code-generator";

export const typeToTypeScriptType = (type_: data.Type): ts.Type => {
  switch (type_._) {
    case "Int32":
      return ts.typeNumber;

    case "String":
      return ts.typeString;

    case "Bool":
      return ts.typeBoolean;

    case "Binary":
      return ts.uint8ArrayType;

    case "List":
      return ts.readonlyArrayType(typeToTypeScriptType(type_.type_));

    case "Maybe":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Maybe")),
        [typeToTypeScriptType(type_.type_)]
      );
    case "Result":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Result")),
        [
          typeToTypeScriptType(type_.okAndErrorType.error),
          typeToTypeScriptType(type_.okAndErrorType.ok),
        ]
      );

    case "Id":
    case "Token":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));

    case "Custom": {
      if (type_.nameAndTypeParameterList.parameterList.length === 0) {
        return ts.typeScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        );
      }
      return ts.typeWithParameter(
        ts.typeScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        ),
        type_.nameAndTypeParameterList.parameterList.map(typeToTypeScriptType)
      );
    }

    case "Parameter":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));
  }
};

export const typeToMemberOrParameterName = (
  type_: data.Type
): identifer.Identifer => {
  return identifer.fromString(firstLowerCase(toTypeName(type_)));
};

export const moduleName = "@narumincho/type";

export const codecPropertyName = "codec";
export const encodePropertyName = "encode";
export const decodePropertyName = "decode";
export const resultProperty = "result";
export const nextIndexProperty = "nextIndex";

export const toTypeName = (type_: data.Type): string => {
  switch (type_._) {
    case "Int32":
      return "Int32";
    case "String":
      return "String";
    case "Bool":
      return "Bool";
    case "Binary":
      return "Binary";
    case "List":
      return toTypeName(type_.type_) + "List";
    case "Maybe":
      return toTypeName(type_.type_) + "Maybe";
    case "Result":
      return (
        toTypeName(type_.okAndErrorType.error) +
        toTypeName(type_.okAndErrorType.ok) +
        "Result"
      );
    case "Id":
    case "Token":
      return type_.string_;
    case "Custom":
      return type_.nameAndTypeParameterList.name;
    case "Parameter":
      return type_.string_;
  }
};

export const isTagTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<data.Pattern>
): boolean =>
  tagNameAndParameterArray.every(
    (tagNameAndParameter) => tagNameAndParameter.parameter._ === "Nothing"
  );

export type IdAndTokenNameSet = {
  id: ReadonlySet<string>;
  token: ReadonlySet<string>;
};

export const collectIdOrTokenTypeNameSet = (
  customTypeList: ReadonlyArray<data.CustomTypeDefinition>
): IdAndTokenNameSet =>
  flatIdAndTokenNameSetList(
    customTypeList.map(collectIdOrTokenTypeNameSetInCustomType)
  );

const collectIdOrTokenTypeNameSetInCustomType = (
  customType: data.CustomTypeDefinition
): IdAndTokenNameSet => {
  switch (customType.body._) {
    case "Product":
      return flatIdAndTokenNameSetList(
        customType.body.memberList.map((memberNameAndType) =>
          getIdAndTokenTypeNameInType(memberNameAndType.type)
        )
      );
    case "Sum":
      return collectIdOrTokenTypeNameSetInSum(customType.body.patternList);
  }
};

const collectIdOrTokenTypeNameSetInSum = (
  tagNameAndParameterList: ReadonlyArray<data.Pattern>
): IdAndTokenNameSet => {
  const idSet: Set<string> = new Set();
  const tokenSet: Set<string> = new Set();
  for (const memberNameAndType of tagNameAndParameterList) {
    switch (memberNameAndType.parameter._) {
      case "Just": {
        const idAndTokenNameSet = getIdAndTokenTypeNameInType(
          memberNameAndType.parameter.value
        );
        for (const id of idAndTokenNameSet.id) {
          idSet.add(id);
        }
        for (const token of idAndTokenNameSet.token) {
          tokenSet.add(token);
        }
      }
    }
  }
  return {
    id: idSet,
    token: tokenSet,
  };
};

const getIdAndTokenTypeNameInType = (type_: data.Type): IdAndTokenNameSet => {
  switch (type_._) {
    case "Int32":
    case "String":
    case "Bool":
    case "Binary":
    case "Parameter":
      return { id: new Set(), token: new Set() };
    case "Id":
      return { id: new Set([type_.string_]), token: new Set() };
    case "Token":
      return { id: new Set(), token: new Set([type_.string_]) };
    case "List":
    case "Maybe":
      return getIdAndTokenTypeNameInType(type_.type_);
    case "Result":
      return flatIdAndTokenNameSetList([
        getIdAndTokenTypeNameInType(type_.okAndErrorType.ok),
        getIdAndTokenTypeNameInType(type_.okAndErrorType.error),
      ]);
    case "Custom":
      return flatIdAndTokenNameSetList(
        type_.nameAndTypeParameterList.parameterList.map(
          getIdAndTokenTypeNameInType
        )
      );
  }
};

const flatIdAndTokenNameSetList = (
  list: ReadonlyArray<IdAndTokenNameSet>
): IdAndTokenNameSet => {
  const idSet: Set<string> = new Set();
  const tokenSet: Set<string> = new Set();
  for (const idAndToken of list) {
    for (const id of idAndToken.id) {
      idSet.add(id);
    }
    for (const name of idAndToken.token) {
      tokenSet.add(name);
    }
  }
  return {
    id: idSet,
    token: tokenSet,
  };
};

export const isIncludeBinaryType = (
  customType: data.CustomTypeDefinition
): boolean => {
  switch (customType.body._) {
    case "Product":
      return isIncludeBinaryTypeInProduct(customType.body.memberList);
    case "Sum":
      return isIncludeBinaryTypeInSum(customType.body.patternList);
  }
};

const isIncludeBinaryTypeInProduct = (
  memberList: ReadonlyArray<data.Member>
): boolean => {
  for (const member of memberList) {
    if (isIncludeBinaryTypeInType(member.type)) {
      return true;
    }
  }
  return false;
};

const isIncludeBinaryTypeInSum = (
  patternList: ReadonlyArray<data.Pattern>
): boolean => {
  for (const pattern of patternList) {
    switch (pattern.parameter._) {
      case "Just":
        if (isIncludeBinaryTypeInType(pattern.parameter.value)) {
          return true;
        }
    }
  }
  return false;
};

const isIncludeBinaryTypeInType = (type_: data.Type): boolean => {
  switch (type_._) {
    case "Int32":
    case "String":
    case "Bool":
    case "Custom":
    case "Id":
    case "Token":
      return false;
    case "Binary":
      return true;
    case "List":
    case "Maybe":
      return isIncludeBinaryTypeInType(type_.type_);
    case "Result":
      return (
        isIncludeBinaryTypeInType(type_.okAndErrorType.ok) ||
        isIncludeBinaryTypeInType(type_.okAndErrorType.error)
      );
    case "Parameter":
      return false;
  }
};

export const firstUpperCase = (text: string): string =>
  text.substring(0, 1).toUpperCase() + text.substring(1);

export const firstLowerCase = (text: string): string =>
  text.substring(0, 1).toLowerCase() + text.substring(1);

export const isFirstUpperCaseName = (text: string): boolean => {
  if (text === "") {
    return false;
  }
  if (!"ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(text[0])) {
    return false;
  }
  for (const char of text.slice(1)) {
    if (
      !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(
        char
      )
    ) {
      return false;
    }
  }
  return true;
};

export const isFirstLowerCaseName = (text: string): boolean => {
  if (text === "") {
    return false;
  }
  if (!"abcdefghijklmnopqrstuvwxyz".includes(text[0])) {
    return false;
  }
  for (const char of text.slice(1)) {
    if (
      !"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(
        char
      )
    ) {
      return false;
    }
  }
  return true;
};
