import * as binary from "./kernel/binary";
import * as bool from "./kernel/bool";
import * as data from "./data";
import * as int32 from "./kernel/int32";
import * as kernelString from "./kernel/string";
import * as list from "./kernel/list";
import * as maybe from "./kernel/maybe";
import * as result from "./kernel/result";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as url from "./kernel/url";
import { identifer } from "js-ts-code-generator";

export const typeToTypeScriptType = (type_: data.Type): ts.Type => {
  switch (type_._) {
    case "Int32":
      return int32.type;

    case "String":
      return kernelString.type;

    case "Bool":
      return bool.type;

    case "Binary":
      return binary.type;

    case "Url":
      return url.type;

    case "List":
      return list.type(typeToTypeScriptType(type_.type));

    case "Maybe":
      return maybe.type(typeToTypeScriptType(type_.type));

    case "Result":
      return result.type(
        typeToTypeScriptType(type_.okAndErrorType.error),
        typeToTypeScriptType(type_.okAndErrorType.ok)
      );

    case "Id":
    case "Token":
      return ts.Type.ScopeInFile(identifer.fromString(type_.string));

    case "Custom": {
      if (type_.nameAndTypeParameterList.parameterList.length === 0) {
        return ts.Type.ScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        );
      }
      return ts.Type.WithTypeParameter({
        type: ts.Type.ScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        ),
        typeParameterList: type_.nameAndTypeParameterList.parameterList.map(
          typeToTypeScriptType
        ),
      });
    }

    case "Parameter":
      return ts.Type.ScopeInFile(identifer.fromString(type_.string));
  }
};

export const typeToMemberOrParameterName = (type_: data.Type): string => {
  return firstLowerCase(toTypeName(type_));
};

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
    case "Url":
      return "Url";
    case "List":
      return toTypeName(type_.type) + "List";
    case "Maybe":
      return toTypeName(type_.type) + "Maybe";
    case "Result":
      return (
        toTypeName(type_.okAndErrorType.error) +
        toTypeName(type_.okAndErrorType.ok) +
        "Result"
      );
    case "Id":
    case "Token":
      return type_.string;
    case "Custom":
      return type_.nameAndTypeParameterList.name;
    case "Parameter":
      return type_.string;
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
    case "Url":
    case "Parameter":
      return { id: new Set(), token: new Set() };
    case "Id":
      return { id: new Set([type_.string]), token: new Set() };
    case "Token":
      return { id: new Set(), token: new Set([type_.string]) };
    case "List":
    case "Maybe":
      return getIdAndTokenTypeNameInType(type_.type);
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
  IdAndTokenNameSetList: ReadonlyArray<IdAndTokenNameSet>
): IdAndTokenNameSet => {
  const idSet: Set<string> = new Set();
  const tokenSet: Set<string> = new Set();
  for (const idAndToken of IdAndTokenNameSetList) {
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
