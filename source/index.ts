type Type =
  | { tag: Type_.UInt32 }
  | { tag: Type_.String }
  | { tag: Type_.Id; parameter: Type }
  | { tag: Type_.Hash; parameter: Type }
  | { tag: Type_.List; parameter: Type }
  | { tag: Type_.Map; parameter: MapType }
  | { tag: Type_.Set; parameter: Type }
  | { tag: Type_.Custom; parameter: CustomType };

const enum Type_ {
  UInt32,
  String,
  Id,
  Hash,
  List,
  Map,
  Set,
  Custom
}

type MapType = {
  key: Type;
  value: Type;
};

type CustomType = {
  name: string;
  body: CustomTypeBody;
};

type CustomTypeBody =
  | {
      tag: CustomType_.Product;
      parameter: ReadonlyArray<TagNameAndParameter>;
    }
  | {
      tag: CustomType_.Sum;
      parameter: ReadonlyArray<MemberNameAndType>;
    };

const enum CustomType_ {
  Product,
  Sum
}

type TagNameAndParameter = {
  name: string;
  parameter: Type | null;
};

type MemberNameAndType = {
  name: string;
  memberType: Type;
};
