export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Id; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Dictionary; dictionaryType: DictionaryType }
  | { _: Type_.Set; type_: Type }
  | { _: Type_.Custom; string_: string };

export const enum Type_ {
  UInt32,
  String,
  Id,
  Hash,
  List,
  Dictionary,
  Set,
  Custom
}

export type DictionaryType = {
  key: Type;
  value: Type;
};

export type CustomType = {
  description: string;
  body: CustomTypeBody;
  idHashType: IdHashType;
};

export type CustomTypeBody =
  | {
      _: CustomType_.Product;
      tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>;
    }
  | {
      _: CustomType_.Sum;
      memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>;
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

export const typeDictionary = (dictionaryType: DictionaryType): Type => ({
  _: Type_.Dictionary,
  dictionaryType
});

export const typeSet = (type_: Type): Type => ({
  _: Type_.Set,
  type_
});

/** 型名は大文字にする必要がある */
export const typeCustom = (string_: string): Type => ({
  _: Type_.Custom,
  string_
});

export const customTypeBodyProduct = (
  tagNameAndParameterArray: ReadonlyArray<TagNameAndParameter>
): CustomTypeBody => ({
  _: CustomType_.Product,
  tagNameAndParameterArray
});

export const customTypeBodySum = (
  memberNameAndTypeArray: ReadonlyArray<MemberNameAndType>
): CustomTypeBody => ({
  _: CustomType_.Sum,
  memberNameAndTypeArray
});

export const tagParameterJust = (type_: Type): TagParameter => ({
  _: TagParameter_.Just,
  type_
});

export const tagParameterNothing: TagParameter = {
  _: TagParameter_.Nothing
};
