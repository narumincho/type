import * as c from "./case";

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
  | { _: "Result"; result: Result }
  | { _: "Id"; string_: string }
  | { _: "Hash"; string_: string }
  | { _: "AccessToken" }
  | { _: "Custom"; string_: string };

export type Result = { ok: Type; error: Type };

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
 */
export const typeList = (type_: Type): Type => ({
  _: "List",
  type_: type_
});

/**
 * Maybe
 */
export const typeMaybe = (type_: Type): Type => ({
  _: "Maybe",
  type_: type_
});

export const typeResult = (result: Result): Type => ({ _: "Result", result });

/**
 * Id. データを識別するためのもの. カスタムの型名を指定する
 * @param string_
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_
});

/**
 * Hash. データを識別するためのHash
 * @param string_
 */
export const typeHash = (string_: string): Type => ({
  _: "Hash",
  string_: string_
});

/**
 * トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する
 * @param string_
 */
export const typeAccessToken = (): Type => ({
  _: "AccessToken"
});

/**
 * 用意されていないアプリ特有の型
 * @param string_
 */
export const typeCustom = (string_: string): Type => ({
  _: "Custom",
  string_: string_
});

export type CustomType = {
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

export type Maybe<T> =
  | {
      _: "Just";
      t: T;
    }
  | {
      _: "Nothing";
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

export const maybeJust = <T>(t: T): Maybe<T> => ({
  _: "Just",
  t
});

export const maybeNothing = <T>(): Maybe<T> => ({
  _: "Nothing"
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
    case "List":
      return toTypeName(type_.type_) + "List";
    case "Maybe":
      return toTypeName(type_.type_) + "Maybe";
    case "Result":
      return (
        toTypeName(type_.result.error) + toTypeName(type_.result.ok) + "Result"
      );
    case "Id":
      return customTypeToTypeName(type_.string_) + "Id";
    case "Hash":
      return customTypeToTypeName(type_.string_) + "Hash";
    case "AccessToken":
      return "AccessToken";
    case "Custom":
      return customTypeToTypeName(type_.string_);
  }
};
