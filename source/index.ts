export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Id; type_: Type }
  | { _: Type_.Hash; type_: Type }
  | { _: Type_.Maybe; type_: Type }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Dictionary; dictionaryType: DictionaryType }
  | { _: Type_.Set; type_: Type }
  | { _: Type_.Custom; customType: CustomType };

export const enum Type_ {
  UInt32,
  String,
  Id,
  Hash,
  Maybe,
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
  name: string;
  body: CustomTypeBody;
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
  parameter: TagParameter;
};

export type MemberNameAndType = {
  name: string;
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

