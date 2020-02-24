export type Type =
  | { tag: Type_.UInt32 }
  | { tag: Type_.String }
  | { tag: Type_.Id; parameter: Type }
  | { tag: Type_.Hash; parameter: Type }
  | { tag: Type_.Maybe; parameter: Type }
  | { tag: Type_.List; parameter: Type }
  | { tag: Type_.Dictionary; parameter: DictionaryType }
  | { tag: Type_.Set; parameter: Type }
  | { tag: Type_.Custom; parameter: CustomType };

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
      tag: CustomType_.Product;
      parameter: ReadonlyArray<TagNameAndParameter>;
    }
  | {
      tag: CustomType_.Sum;
      parameter: ReadonlyArray<MemberNameAndType>;
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
      tag: TagParameter_.Just;
      parameter: Type;
    }
  | {
      tag: TagParameter_.Nothing;
    };

export const enum TagParameter_ {
  Just,
  Nothing
}

