import * as c from "./case";
import { identifer } from "js-ts-code-generator";

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Maybe<value> =
  | { readonly _: "Just"; readonly value: value }
  | { readonly _: "Nothing" };

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Result<ok, error> =
  | { readonly _: "Ok"; readonly ok: ok }
  | { readonly _: "Error"; readonly error: error };

/**
 * 型
 */
export type Type =
  | { readonly _: "Int32" }
  | { readonly _: "String" }
  | { readonly _: "Bool" }
  | { readonly _: "Binary" }
  | { readonly _: "List"; readonly type_: Type }
  | { readonly _: "Maybe"; readonly type_: Type }
  | { readonly _: "Result"; readonly okAndErrorType: OkAndErrorType }
  | { readonly _: "Id"; readonly string_: string }
  | { readonly _: "Token"; readonly string_: string }
  | {
      readonly _: "Custom";
      readonly nameAndTypeParameterList: NameAndTypeParameterList;
    }
  | { readonly _: "Parameter"; readonly string_: string };

/**
 * 正常値と異常値
 */
export type OkAndErrorType = {
  /**
   * 正常値
   */
  readonly ok: Type;
  /**
   * 異常値
   */
  readonly error: Type;
};

/**
 * カスタム型の指定
 */
export type NameAndTypeParameterList = {
  /**
   * カスタム型名
   */
  readonly name: string;
  /**
   * 型パラメーター
   */
  readonly parameterList: ReadonlyArray<Type>;
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Maybe: {
  /**
   * 値があるということ
   */
  readonly Just: <value>(a: value) => Maybe<value>;
  /**
   * 値がないということ
   */
  readonly Nothing: <value>() => Maybe<value>;
} = {
  Just: <value>(value: value): Maybe<value> => ({ _: "Just", value: value }),
  Nothing: <value>(): Maybe<value> => ({ _: "Nothing" }),
};

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Result: {
  /**
   * 成功
   */
  readonly Ok: <ok, error>(a: ok) => Result<ok, error>;
  /**
   * 失敗
   */
  readonly Error: <ok, error>(a: error) => Result<ok, error>;
} = {
  Ok: <ok, error>(ok: ok): Result<ok, error> => ({ _: "Ok", ok: ok }),
  Error: <ok, error>(error: error): Result<ok, error> => ({
    _: "Error",
    error: error,
  }),
};

/**
 * 型
 */
export const Type: {
  /**
   * 32bit 符号付き整数. (-2 147 483 648 ～ 2147483647). JavaScriptのnumberとして扱える
   */
  readonly Int32: Type;
  /**
   * 文字列. JavaScriptのStringとして扱える
   */
  readonly String: Type;
  /**
   * 真偽値. JavaScriptのbooleanとして扱える
   */
  readonly Bool: Type;
  /**
   * バイナリ. JavaScriptのUint8Arrayとして扱える
   */
  readonly Binary: Type;
  /**
   * リスト. JavaScriptのArrayとして扱える
   */
  readonly List: (a: Type) => Type;
  /**
   * Maybe. 指定した型の値があるJustと値がないNothingのどちらか
   */
  readonly Maybe: (a: Type) => Type;
  /**
   * Result. 成功と失敗を表す
   */
  readonly Result: (a: OkAndErrorType) => Type;
  /**
   * データを識別するためのもの. `UserId`などの型名を指定する. 16byte. 16進数文字列で32文字
   */
  readonly Id: (a: string) => Type;
  /**
   * データを識別,証明するため. `AccessToken`などの型名を指定する. 32byte. 16進数文字列で64文字
   */
  readonly Token: (a: string) => Type;
  /**
   * 用意されていないアプリ特有の型
   */
  readonly Custom: (a: NameAndTypeParameterList) => Type;
  /**
   * カスタム型の定義で使う型変数
   */
  readonly Parameter: (a: string) => Type;
} = {
  Int32: { _: "Int32" },
  String: { _: "String" },
  Bool: { _: "Bool" },
  Binary: { _: "Binary" },
  List: (type_: Type): Type => ({ _: "List", type_: type_ }),
  Maybe: (type_: Type): Type => ({ _: "Maybe", type_: type_ }),
  Result: (okAndErrorType: OkAndErrorType): Type => ({
    _: "Result",
    okAndErrorType: okAndErrorType,
  }),
  Id: (string_: string): Type => ({ _: "Id", string_: string_ }),
  Token: (string_: string): Type => ({ _: "Token", string_: string_ }),
  Custom: (nameAndTypeParameterList: NameAndTypeParameterList): Type => ({
    _: "Custom",
    nameAndTypeParameterList: nameAndTypeParameterList,
  }),
  Parameter: (string_: string): Type => ({ _: "Parameter", string_: string_ }),
};

export type CustomTypeDefinition = {
  name: string;
  /** 型パラメーターは小文字で始めなければならない. Elmでの出力と外部の型を隠さないようにするため
   */
  typeParameterList: ReadonlyArray<string>;
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

export type IdAndTokenNameSet = {
  id: ReadonlySet<string>;
  token: ReadonlySet<string>;
};

export const collectIdOrTokenTypeNameSet = (
  customTypeList: ReadonlyArray<CustomTypeDefinition>
): IdAndTokenNameSet =>
  flatIdAndTokenNameSetList(
    customTypeList.map(collectIdOrTokenTypeNameSetInCustomType)
  );

const collectIdOrTokenTypeNameSetInCustomType = (
  customType: CustomTypeDefinition
): IdAndTokenNameSet => {
  switch (customType.body._) {
    case "Product":
      return flatIdAndTokenNameSetList(
        customType.body.memberNameAndTypeList.map((memberNameAndType) =>
          getIdAndTokenTypeNameInType(memberNameAndType.memberType)
        )
      );
    case "Sum":
      return collectIdOrTokenTypeNameSetInSum(
        customType.body.tagNameAndParameterList
      );
  }
};

const collectIdOrTokenTypeNameSetInSum = (
  tagNameAndParameterList: ReadonlyArray<TagNameAndParameter>
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

const getIdAndTokenTypeNameInType = (type_: Type): IdAndTokenNameSet => {
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
        isIncludeBinaryTypeInType(type_.okAndErrorType.ok) ||
        isIncludeBinaryTypeInType(type_.okAndErrorType.error)
      );
    case "Parameter":
      return false;
  }
};
