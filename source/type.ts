import * as c from "./case";
import { identifer } from "js-ts-code-generator";

export type Schema = {
  customTypeList: ReadonlyArray<CustomType>;
  idOrTokenTypeNameList: ReadonlyArray<string>;
};

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
  | { _: "UInt32" }
  | { _: "String" }
  | { _: "Bool" }
  | { _: "DateTime" }
  | { _: "List"; type_: Type }
  | { _: "Maybe"; type_: Type }
  | { _: "Result"; resultType: ResultType }
  | { _: "Id"; string_: string }
  | { _: "Token"; string_: string }
  | { _: "Custom"; string_: string };

/**
 * 正常値と異常値
 */
export type ResultType = { ok: Type; error: Type };

/**
 * 0～4294967295 32bit符号なし整数
 */
export const typeUInt32: Type = { _: "UInt32" };

/**
 * 文字列
 */
export const typeString: Type = { _: "String" };

/**
 * 真偽値
 */
export const typeBool: Type = { _: "Bool" };

/**
 * 日時
 */
export const typeDateTime: Type = { _: "DateTime" };

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
  resultType: resultType
});

/**
 * データを識別するためのもの. `UserId`などの型名を指定する. 16byte. 16進数文字列で32文字
 *
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_
});

/**
 * データを識別するため. `AccessToken`などの型名を指定する. 32byte. 16進数文字列で64文字
 *
 */
export const typeToken = (string_: string): Type => ({
  _: "Token",
  string_: string_
});

/**
 * 用意されていないアプリ特有の型
 *
 */
export const typeCustom = (string_: string): Type => ({
  _: "Custom",
  string_: string_
});

export type CustomType = {
  name: string;
  description: string;
  body: CustomTypeBody;
};

export type CustomTypeBody =
  | {
      _: "Product";
      memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>;
    }
  | {
      _: "Sum";
      tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>;
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
  tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>
): CustomTypeBody => ({
  _: "Sum",
  tagNameAndParameterArray
});

export const customTypeBodyProduct = (
  memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>
): CustomTypeBody => ({
  _: "Product",
  memberNameAndTypeArray
});

export const maybeJust = <T>(value: T): Maybe<T> => ({
  _: "Just",
  value: value
});

export const maybeNothing = <T>(): Maybe<T> => ({
  _: "Nothing"
});

export const resultOk = <ok, error>(ok: ok): Result<ok, error> => ({
  _: "Ok",
  ok: ok
});

export const resultError = <ok, error>(error: error): Result<ok, error> => ({
  _: "Error",
  error: error
});

export const customTypeToTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName);

/**
 * UInt32, String, UInt32List
 */
export const toTypeName = (type_: Type): string => {
  switch (type_._) {
    case "UInt32":
      return "UInt32";
    case "String":
      return "String";
    case "Bool":
      return "Bool";
    case "DateTime":
      return "DateTime";
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
      return customTypeToTypeName(type_.string_);
    case "Custom":
      return customTypeToTypeName(type_.string_);
  }
};

export const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    tagNameAndParameter => tagNameAndParameter.parameter._ === "Nothing"
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
  "alias"
];
