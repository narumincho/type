import * as c from "./case";

/**
 * 型
 */
export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Bool }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Id; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.AccessToken }
  | { _: Type_.Custom; string_: string };
/**
 * キーと値
 */
export type DictionaryType = { key: Type; value: Type };
export const enum Type_ {
  UInt32 = 0,
  String = 1,
  Bool = 2,
  List = 4,
  Id = 5,
  Hash = 6,
  AccessToken = 7,
  Custom = 8
}
/**
 * 0～4294967295 32bit符号なし整数

 */
export const typeUInt32 = (): Type => ({ _: Type_.UInt32 });

/**
 * 文字列

 */
export const typeString = (): Type => ({ _: Type_.String });

/**
 * 真偽値

 */
export const typeBool = (): Type => ({ _: Type_.Bool });

/**
 * リスト
 * @param type_
 */
export const typeList = (type_: Type): Type => ({
  _: Type_.List,
  type_: type_
});

/**
 * Id. データを識別するためのもの. カスタムの型名を指定する
 * @param string_
 */
export const typeId = (string_: string): Type => ({
  _: Type_.Id,
  string_: string_
});

/**
 * Hash. データを識別するためのHash
 * @param string_
 */
export const typeHash = (string_: string): Type => ({
  _: Type_.Hash,
  string_: string_
});

/**
 * トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する
 * @param string_
 */
export const typeToken = (): Type => ({
  _: Type_.AccessToken
});

/**
 * 用意されていないアプリ特有の型
 * @param string_
 */
export const typeCustom = (string_: string): Type => ({
  _: Type_.Custom,
  string_: string_
});

export type CustomType = {
  description: string;
  body: CustomTypeBody;
  idHashType: IdHashType;
};

export type CustomTypeBody =
  | {
      _: CustomType_.Product;
      memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>;
    }
  | {
      _: CustomType_.Sum;
      tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>;
    };

export const enum CustomType_ {
  Product,
  Sum
}

export type TagNameAndParameter = {
  name: string;
  description: string;
  parameter: TagParameter;
};

export type MemberNameAndType = {
  name: string;
  description: string;
  memberType: Type;
};

export type TagParameter =
  | {
      _: TagParameter_.Just;
      type_: Type;
    }
  | {
      _: TagParameter_.Nothing;
    };

export const enum TagParameter_ {
  Just,
  Nothing
}

export const enum IdHashType {
  Id,
  Hash,
  None
}

export const customTypeBodySum = (
  tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>
): CustomTypeBody => ({
  _: CustomType_.Sum,
  tagNameAndParameterArray
});

export const customTypeBodyProduct = (
  memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>
): CustomTypeBody => ({
  _: CustomType_.Product,
  memberNameAndTypeArray
});

export const tagParameterJust = (type_: Type): TagParameter => ({
  _: TagParameter_.Just,
  type_
});

export const tagParameterNothing: TagParameter = {
  _: TagParameter_.Nothing
};

export const customTypeToTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName);

/**
 * UInt32, String, UInt32List
 */
export const toTypeName = (type_: Type): string => {
  switch (type_._) {
    case Type_.UInt32:
      return "UInt32";
    case Type_.String:
      return "String";
    case Type_.Bool:
      return "Bool";
    case Type_.List:
      return toTypeName(type_.type_) + "List";
    case Type_.Id:
      return customTypeToTypeName(type_.string_) + "Id";
    case Type_.Hash:
      return customTypeToTypeName(type_.string_) + "Hash";
    case Type_.AccessToken:
      return "AccessToken";
    case Type_.Custom:
      return customTypeToTypeName(type_.string_);
  }
};

/**
 * デコーダー、エンコーダに必要な型を集める。必ずUInt32は入る
 */
export const customTypeDictionaryCollectType = (
  customTypeDictionary: ReadonlyMap<string, CustomType>
): ReadonlyArray<Type> => {
  let needTypeList: ReadonlyArray<Type> = [typeUInt32()];
  for (const customType of customTypeDictionary.values()) {
    needTypeList = needTypeList.concat(customTypeCollectType(customType));
  }
  return typeListUnique(needTypeList);
};

const customTypeCollectType = (customType: CustomType): ReadonlyArray<Type> => {
  switch (customType.body._) {
    case CustomType_.Product:
      return customType.body.memberNameAndTypeArray.map(
        memberNameAndType => memberNameAndType.memberType
      );

    case CustomType_.Sum: {
      const typeList: Array<Type> = [];
      for (const tagNameAndParameter of customType.body
        .tagNameAndParameterArray) {
        switch (tagNameAndParameter.parameter._) {
          case TagParameter_.Just:
            typeList.push(tagNameAndParameter.parameter.type_);
        }
      }
      return typeList;
    }
  }
};

/**
 * 型の重複をなくす
 */
const typeListUnique = (list: ReadonlyArray<Type>): ReadonlyArray<Type> => {
  const resultList: Array<Type> = [];
  for (const type_ of list) {
    if (
      !resultList.some(resultElement => equalByStructure(type_, resultElement))
    ) {
      resultList.push(type_);
    }
  }
  return resultList;
};

/**
 * エンコーダ、デコーダーのコードを作る上でかぶらないように比較する
 */
export const equalByStructure = (a: Type, b: Type): boolean => {
  switch (a._) {
    case Type_.UInt32:
      return b._ === Type_.UInt32;
    case Type_.String:
      return b._ === Type_.String;
    case Type_.Bool:
      return b._ === Type_.Bool;
    case Type_.Id:
      return b._ === Type_.Id;
    case Type_.Hash:
      return b._ === Type_.Hash;
    case Type_.List:
      return b._ === Type_.List && equalByStructure(a.type_, b.type_);
    case Type_.AccessToken:
      return b._ === Type_.AccessToken;
    case Type_.Custom:
      return b._ === Type_.Custom && b.string_ === a.string_;
  }
};
