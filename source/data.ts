/**
 * バイナリと相互変換するための関数
 */
export type Codec<T> = {
  readonly encode: (a: T) => ReadonlyArray<number>;
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number };
};

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
 * カスタム型の定義
 */
export type CustomTypeDefinition = {
  /**
   * 型の名前. [A-Z][a-zA-Z0-9]* の正規表現を満たせばOK
   */
  readonly name: string;
  /**
   * 型の説明. DOCコメントそしてコードに出力される
   */
  readonly description: string;
  /**
   * 型パラメーターは小文字で始めなければならない. Elmでの出力と外部の型を隠さないようにするため
   */
  readonly typeParameterList: ReadonlyArray<string>;
  /**
   * 型の定義の本体
   */
  readonly body: CustomTypeDefinitionBody;
};

/**
 * カスタム型の定義の本体
 */
export type CustomTypeDefinitionBody =
  | { readonly _: "Product"; readonly memberList: ReadonlyArray<Member> }
  | { readonly _: "Sum"; readonly patternList: ReadonlyArray<Pattern> };

/**
 * 直積型の構成要素. 名前と型を持つ
 */
export type Member = {
  /**
   * メンバー名
   */
  readonly name: string;
  /**
   * メンバーの説明
   */
  readonly description: string;
  /**
   * 型
   */
  readonly type: Type;
};

/**
 * 直和型の構成要素. タグと,パラメーターの型がついている
 */
export type Pattern = {
  /**
   * タグ名
   */
  readonly name: string;
  /**
   * パターンの説明
   */
  readonly description: string;
  /**
   * そのパターンにある型
   */
  readonly parameter: Maybe<Type>;
};

/**
 * -2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う
 */
export const Int32: {} = {};

/**
 * 文字列. JavaScriptのstringで扱う
 */
export const String: {} = {};

/**
 * Bool. 真か偽. JavaScriptのbooleanで扱う
 */
export const Bool: {} = {};

/**
 * バイナリ. JavaScriptのUint8Arrayで扱う
 */
export const Binary: {} = {};

/**
 * リスト. JavaScriptのArrayで扱う
 */
export const List: {} = {};

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
  readonly codec: <value>(a: Codec<value>) => Codec<Maybe<value>>;
} = {
  Just: <value>(value: value): Maybe<value> => ({ _: "Just", value: value }),
  Nothing: <value>(): Maybe<value> => ({ _: "Nothing" }),
  codec: (): {} => {},
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
  readonly codec: <ok, error>(
    a: Codec<ok>,
    b: Codec<error>
  ) => Codec<Result<ok, error>>;
} = {
  Ok: <ok, error>(ok: ok): Result<ok, error> => ({ _: "Ok", ok: ok }),
  Error: <ok, error>(error: error): Result<ok, error> => ({
    _: "Error",
    error: error,
  }),
  codec: (): {} => {},
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
  readonly codec: Codec<Type>;
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
  codec: (): {} => {},
};

/**
 * 正常値と異常値
 */
export const OkAndErrorType: { readonly codec: Codec<OkAndErrorType> } = {
  codec: {
    encode: (OkAndErrorType: OkAndErrorType): ReadonlyArray<number> =>
      Type.codec
        .encode(OkAndErrorType.ok)
        .concat(Type.codec.encode(OkAndErrorType.error)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: OkAndErrorType; readonly nextIndex: number } => {},
  },
};

/**
 * カスタム型の指定
 */
export const NameAndTypeParameterList: {
  readonly codec: Codec<NameAndTypeParameterList>;
} = {
  codec: {
    encode: (
      NameAndTypeParameterList: NameAndTypeParameterList
    ): ReadonlyArray<number> =>
      String.codec
        .encode(NameAndTypeParameterList.name)
        .concat(
          List.codec(Type.codec).encode(NameAndTypeParameterList.parameterList)
        ),
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: NameAndTypeParameterList;
      readonly nextIndex: number;
    } => {},
  },
};

/**
 * カスタム型の定義
 */
export const CustomTypeDefinition: {
  readonly codec: Codec<CustomTypeDefinition>;
} = {
  codec: {
    encode: (
      CustomTypeDefinition: CustomTypeDefinition
    ): ReadonlyArray<number> =>
      String.codec
        .encode(CustomTypeDefinition.name)
        .concat(String.codec.encode(CustomTypeDefinition.description))
        .concat(
          List.codec(String.codec).encode(
            CustomTypeDefinition.typeParameterList
          )
        )
        .concat(
          CustomTypeDefinitionBody.codec.encode(CustomTypeDefinition.body)
        ),
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: CustomTypeDefinition;
      readonly nextIndex: number;
    } => {},
  },
};

/**
 * カスタム型の定義の本体
 */
export const CustomTypeDefinitionBody: {
  /**
   * 直積型. AとBとC
   */
  readonly Product: (a: ReadonlyArray<Member>) => CustomTypeDefinitionBody;
  /**
   * 直和型. AかBかC
   */
  readonly Sum: (a: ReadonlyArray<Pattern>) => CustomTypeDefinitionBody;
  readonly codec: Codec<CustomTypeDefinitionBody>;
} = {
  Product: (memberList: ReadonlyArray<Member>): CustomTypeDefinitionBody => ({
    _: "Product",
    memberList: memberList,
  }),
  Sum: (patternList: ReadonlyArray<Pattern>): CustomTypeDefinitionBody => ({
    _: "Sum",
    patternList: patternList,
  }),
  codec: (): {} => {},
};

/**
 * 直積型の構成要素. 名前と型を持つ
 */
export const Member: { readonly codec: Codec<Member> } = {
  codec: {
    encode: (Member: Member): ReadonlyArray<number> =>
      String.codec
        .encode(Member.name)
        .concat(String.codec.encode(Member.description))
        .concat(Type.codec.encode(Member["type"])),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Member; readonly nextIndex: number } => {},
  },
};

/**
 * 直和型の構成要素. タグと,パラメーターの型がついている
 */
export const Pattern: { readonly codec: Codec<Pattern> } = {
  codec: {
    encode: (Pattern: Pattern): ReadonlyArray<number> =>
      String.codec
        .encode(Pattern.name)
        .concat(String.codec.encode(Pattern.description))
        .concat(Maybe.codec(Type.codec).encode(Pattern.parameter)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Pattern; readonly nextIndex: number } => {},
  },
};
