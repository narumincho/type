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
  | { _: "Int32" }
  | { _: "Int64" }
  | { _: "String" }
  | { _: "Bool" }
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
 * -2 147 483 648 ～ 2147483647 32bit 符号付き整数
 */
export const typeInt32: Type = { _: "Int32" };

/**
 * -‭9 223 372 036 854 775 808‬ ～ ‭9 223 372 036 854 775 807‬ 64bit 符号付き整数
 */
export const typeInt64: Type = { _: "Int64" };

/**
 * 文字列
 */
export const typeString: Type = { _: "String" };

/**
 * 真偽値
 */
export const typeBool: Type = { _: "Bool" };

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

export const toTypeName = (type_: Type): string => {
  switch (type_._) {
    case "Int32":
      return "Int32";
    case "Int64":
      return "Int64";
    case "String":
      return "String";
    case "Bool":
      return "Bool";
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
