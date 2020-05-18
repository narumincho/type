import * as c from "./case";
import { identifer } from "js-ts-code-generator";

/**
 * Maybe
 */
export type Maybe<T> = { _: "Just"; value: T } | { _: "Nothing" };

/**
 * Result
 */
export type Result<ok, error> =
  | { _: "Ok"; ok: ok }
  | { _: "Error"; error: error };

/**
 * 型
 */
export type Type =
  | { _: "Int32" }
  | { _: "String" }
  | { _: "Bool" }
  | { _: "Binary" }
  | { _: "List"; type_: Type }
  | { _: "Maybe"; type_: Type }
  | { _: "Result"; resultType: ResultType }
  | { _: "Id"; string_: string }
  | { _: "Token"; string_: string }
  | { _: "Custom"; customType: CustomType }
  | { _: "Parameter"; string_: string };

/**
 * 正常値と異常値
 */
export type ResultType = { ok: Type; error: Type };

export type CustomType = { name: string; parameter: ReadonlyArray<Type> };

/**
 * -2 147 483 648 ～ 2147483647. 32bit 符号付き整数
 */
export const typeInt32: Type = { _: "Int32" };

/**
 * 文字列
 */
export const typeString: Type = { _: "String" };

/**
 * 真偽値
 */
export const typeBool: Type = { _: "Bool" };

/**
 * バイナリ
 */
export const typeBinary: Type = { _: "Binary" };
/**
 * リスト
 *
 */
export const typeList = (type_: Type): Type => ({ _: "List", type_: type_ });

/**
 * Maybe
 *
 */
export const typeMaybe = (type_: Type): Type => ({ _: "Maybe", type_: type_ });

/**
 * Result
 *
 */
export const typeResult = (resultType: ResultType): Type => ({
  _: "Result",
  resultType: resultType,
});

/**
 * データを識別するためのもの. `UserId`などの型名を指定する. 16byte. 16進数文字列で32文字
 *
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_,
});

/**
 * データを識別するため. `AccessToken`などの型名を指定する. 32byte. 16進数文字列で64文字
 *
 */
export const typeToken = (string_: string): Type => ({
  _: "Token",
  string_: string_,
});

/**
 * 用意されていないアプリ特有の型
 *
 */
export const typeCustom = (customType: CustomType): Type => ({
  _: "Custom",
  customType: customType,
});

/**
 * パラメーター
 */
export const typeParameter = (string_: string): Type => ({
  _: "Parameter",
  string_: string_,
});

export type CustomTypeDefinition = {
  name: string;
  typeParameter: ReadonlyArray<string>;
  description: string;
  body: CustomTypeBody;
};

export type CustomTypeBody =
  | {
      _: "Product";
      memberNameAndTypeList: ReadonlyArray<MemberNameAndType>;
    }
  | {
      _: "Sum";
      tagNameAndParameterList: ReadonlyArray<TagNameAndParameter>;
    };

export type TagNameAndParameter = {
  name: string;
  description: string;
  parameter: Maybe<Type>;
};

export type MemberNameAndType = {
  name: string;
  description: string;
  memberType: Type;
};

export const customTypeBodySum = (
  tagNameAndParameterList: ReadonlyArray<TagNameAndParameter>
): CustomTypeBody => ({
  _: "Sum",
  tagNameAndParameterList,
});

export const customTypeBodyProduct = (
  memberNameAndTypeList: ReadonlyArray<MemberNameAndType>
): CustomTypeBody => ({
  _: "Product",
  memberNameAndTypeList,
});

export const maybeJust = <T>(value: T): Maybe<T> => ({
  _: "Just",
  value: value,
});

export const maybeNothing = <T>(): Maybe<T> => ({
  _: "Nothing",
});

export const resultOk = <ok, error>(ok: ok): Result<ok, error> => ({
  _: "Ok",
  ok: ok,
});

export const resultError = <ok, error>(error: error): Result<ok, error> => ({
  _: "Error",
  error: error,
});

export const toTypeName = (type_: Type): string => {
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
        toTypeName(type_.resultType.error) +
        toTypeName(type_.resultType.ok) +
        "Result"
      );
    case "Id":
    case "Token":
      return type_.string_;
    case "Custom":
      return type_.customType.name;
    case "Parameter":
      return type_.string_;
  }
};

export const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    (tagNameAndParameter) => tagNameAndParameter.parameter._ === "Nothing"
  );

export const typeToMemberOrParameterName = (
  type_: Type
): identifer.Identifer => {
  const safeInTypeScript = identifer.fromString(
    c.firstLowerCase(toTypeName(type_))
  );
  if (elmReservedList.includes(safeInTypeScript)) {
    return ((safeInTypeScript as string) + "_") as identifer.Identifer;
  }
  return safeInTypeScript;
};

export const elmIdentiferFromString = (text: string): string => {
  if (elmReservedList.includes(text)) {
    return text + "_";
  }
  return text;
};

const elmReservedList = [
  "if",
  "then",
  "else",
  "case",
  "of",
  "let",
  "in",
  "type",
  "module",
  "where",
  "import",
  "port",
  "exposing",
  "as",
  "alias",
];

export const collectIdOrTokenTypeNameSet = (
  customTypeList: ReadonlyArray<CustomTypeDefinition>
): Set<string> => {
  let idAndTokenTypeNameSet: Set<string> = new Set();
  for (const customType of customTypeList) {
    idAndTokenTypeNameSet = new Set([
      ...idAndTokenTypeNameSet,
      ...collectIdOrTokenTypeNameSetInCustomType(customType),
    ]);
  }
  return idAndTokenTypeNameSet;
};

const collectIdOrTokenTypeNameSetInCustomType = (
  customType: CustomTypeDefinition
): Set<string> => {
  switch (customType.body._) {
    case "Product":
      return collectIdOrTokenTypeNameSetInProduct(
        customType.body.memberNameAndTypeList
      );
    case "Sum":
      return collectIdOrTokenTypeNameSetInSum(
        customType.body.tagNameAndParameterList
      );
  }
};

const collectIdOrTokenTypeNameSetInProduct = (
  memberNameAndTypeList: ReadonlyArray<MemberNameAndType>
): Set<string> => {
  let idAndTokenTypeNameSet: Set<string> = new Set();
  for (const memberNameAndType of memberNameAndTypeList) {
    idAndTokenTypeNameSet = new Set([
      ...idAndTokenTypeNameSet,
      ...getIdOrTokenTypeNameInType(memberNameAndType.memberType),
    ]);
  }
  return idAndTokenTypeNameSet;
};

const collectIdOrTokenTypeNameSetInSum = (
  tagNameAndParameterList: ReadonlyArray<TagNameAndParameter>
): Set<string> => {
  let idAndTokenTypeNameSet: Set<string> = new Set();
  for (const memberNameAndType of tagNameAndParameterList) {
    switch (memberNameAndType.parameter._) {
      case "Just": {
        idAndTokenTypeNameSet = new Set([
          ...idAndTokenTypeNameSet,
          ...getIdOrTokenTypeNameInType(memberNameAndType.parameter.value),
        ]);
      }
    }
  }
  return idAndTokenTypeNameSet;
};

const getIdOrTokenTypeNameInType = (type_: Type): Set<string> => {
  switch (type_._) {
    case "Int32":
    case "String":
    case "Bool":
    case "Binary":
    case "Custom":
    case "Parameter":
      return new Set();
    case "Id":
    case "Token":
      return new Set([type_.string_]);
    case "List":
    case "Maybe":
      return getIdOrTokenTypeNameInType(type_.type_);
    case "Result":
      return new Set([
        ...getIdOrTokenTypeNameInType(type_.resultType.ok),
        ...getIdOrTokenTypeNameInType(type_.resultType.error),
      ]);
  }
};

export const isIncludeBinaryType = (
  customType: CustomTypeDefinition
): boolean => {
  switch (customType.body._) {
    case "Product":
      return isIncludeBinaryTypeInProduct(
        customType.body.memberNameAndTypeList
      );
    case "Sum":
      return isIncludeBinaryTypeInSum(customType.body.tagNameAndParameterList);
  }
};

const isIncludeBinaryTypeInProduct = (
  memberNameAndTypeList: ReadonlyArray<MemberNameAndType>
): boolean => {
  for (const memberNameAndType of memberNameAndTypeList) {
    if (isIncludeBinaryTypeInType(memberNameAndType.memberType)) {
      return true;
    }
  }
  return false;
};

const isIncludeBinaryTypeInSum = (
  tagNameAndParameterList: ReadonlyArray<TagNameAndParameter>
): boolean => {
  for (const tagNameAndParameter of tagNameAndParameterList) {
    switch (tagNameAndParameter.parameter._) {
      case "Just":
        if (isIncludeBinaryTypeInType(tagNameAndParameter.parameter.value)) {
          return true;
        }
    }
  }
  return false;
};

const isIncludeBinaryTypeInType = (type_: Type): boolean => {
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
        isIncludeBinaryTypeInType(type_.resultType.ok) ||
        isIncludeBinaryTypeInType(type_.resultType.error)
      );
    case "Parameter":
      return false;
  }
};
