import * as c from "./case";

/**
 * 型
 */
export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Id; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Custom; string_: string };
/**
 * キーと値
 */
export type DictionaryType = { key: Type; value: Type };

export const enum Type_ {
  UInt32 = 0,
  String = 1,
  Id = 2,
  Hash = 3,
  List = 4,
  Dictionary = 5,
  Set = 6,
  Custom = 7
}

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

export const typeUInt32: Type = {
  _: Type_.UInt32
};

export const typeString: Type = {
  _: Type_.String
};

export const typeId = (string_: string): Type => ({
  _: Type_.Id,
  string_
});

export const typeHash = (string_: string): Type => ({
  _: Type_.Hash,
  string_
});

export const typeList = (type_: Type): Type => ({
  _: Type_.List,
  type_
});

/** 型名は大文字にする必要がある */
export const typeCustom = (string_: string): Type => ({
  _: Type_.Custom,
  string_
});

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
    case Type_.Id:
      return customTypeToTypeName(type_.string_) + "Id";
    case Type_.Hash:
      return customTypeToTypeName(type_.string_) + "Hash";
    case Type_.List:
      return toTypeName(type_.type_) + "List";
    case Type_.Custom:
      return customTypeToTypeName(type_.string_);
  }
};

export const equal = (a: Type, b: Type): boolean => {
  switch (a._) {
    case Type_.UInt32:
      return b._ === Type_.UInt32;
    case Type_.String:
      return b._ === Type_.String;
    case Type_.Id:
      return b._ === Type_.Id && b.string_ === a.string_;
    case Type_.Hash:
      return b._ === Type_.Hash && b.string_ === a.string_;
    case Type_.List:
      return b._ === Type_.List && equal(a.type_, b.type_);
    case Type_.Custom:
      return b._ === Type_.Custom && b.string_ === a.string_;
  }
};
