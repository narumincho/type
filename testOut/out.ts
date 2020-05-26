/**
 * バイナリと相互変換するための関数
 */
export type _Codec<T> = {
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
  | { readonly _: "Int" }
  | { readonly _: "String" }
  | { readonly _: "Bool" }
  | { readonly _: "List"; readonly type_: Type }
  | { readonly _: "Maybe"; readonly type_: Type }
  | { readonly _: "Result"; readonly resultType: ResultType }
  | { readonly _: "Id"; readonly string_: string }
  | { readonly _: "Token"; readonly string_: string }
  | { readonly _: "Custom"; readonly string_: string }
  | { readonly _: "Parameter"; readonly string_: string };

/**
 * 正常値と異常値
 */
export type ResultType = {
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
 * デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる
 */
export type UrlData = {
  /**
   * クライアントモード
   */
  readonly clientMode: ClientMode;
  /**
   * 場所
   */
  readonly location: Location;
  /**
   * 言語
   */
  readonly language: Language;
  /**
   * アクセストークン. ログインした後のリダイレクト先としてサーバーから渡される
   */
  readonly accessToken: Maybe<AccessToken>;
  /**
   * 予約語をこっそり入れてみる
   */
  readonly if: boolean;
};

/**
 * デバッグの状態と, デバッグ時ならアクセスしているポート番号
 */
export type ClientMode =
  | { readonly _: "DebugMode"; readonly int32: number }
  | { readonly _: "Release" };

/**
 * DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる
 */
export type Location =
  | { readonly _: "Home" }
  | { readonly _: "User"; readonly userId: UserId }
  | { readonly _: "Project"; readonly projectId: ProjectId };

/**
 * 英語,日本語,エスペラント語などの言語
 */
export type Language = "Japanese" | "English" | "Esperanto";

/**
 * プロジェクト
 */
export type Project = {
  /**
   * プロジェクト名
   */
  readonly name: string;
  /**
   * プロジェクトのアイコン画像
   */
  readonly icon: FileHash;
  /**
   * プロジェクトのカバー画像
   */
  readonly image: FileHash;
};

/**
 * Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス
 */
export type ResponseWithId<id, data> = {
  /**
   * リクエストしたリソースのID
   */
  readonly id: id;
  /**
   * レスポンス
   */
  readonly response: Response<data>;
};

/**
 * リソースをリクエストしたあとのレスポンス
 */
export type Response<data> =
  | { readonly _: "ConnectionError" }
  | { readonly _: "NotFound" }
  | { readonly _: "Found"; readonly data: data };

export type UserId = string & { readonly _userId: never };

export type ProjectId = string & { readonly _projectId: never };

export type AccessToken = string & { readonly _accessToken: never };

export type FileHash = string & { readonly _fileHash: never };

/**
 * -2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う
 */
export const Int32: {} = {};

/**
 * 文字列. JavaScriptのstringで扱う
 */
export const String: {} = {};

/**
 * バイナリ. JavaScriptのUint8Arrayで扱う
 */
export const Binary: {} = {};

/**
 * リスト. JavaScriptのArrayで扱う
 */
export const List: {} = {};

/**
 * UserId. ものを識別するのに使う
 */
export const UserId: {} = {};

/**
 * ProjectId. ものを識別するのに使う
 */
export const ProjectId: {} = {};

/**
 * AccessToken. ものを識別したり,あるものであるのを証明したりする
 */
export const AccessToken: {} = {};

/**
 * FileHash. ものを識別したり,あるものであるのを証明したりする
 */
export const FileHash: {} = {};

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
  /**
   * Maybeを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: <value>(
    a: (a: value) => ReadonlyArray<number>
  ) => (a: Maybe<value>) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からMaybeにデコードする
   */
  readonly decode: <value>(
    a: (
      a: number,
      b: Uint8Array
    ) => { readonly result: value; readonly nextIndex: number }
  ) => (
    a: number,
    b: Uint8Array
  ) => { readonly result: Maybe<value>; readonly nextIndex: number };
} = {
  Just: <value>(value: value): Maybe<value> => ({ _: "Just", value: value }),
  Nothing: <value>(): Maybe<value> => ({ _: "Nothing" }),
  encode: (): {} => {},
  decode: (): Maybe => {},
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
  /**
   * Resultを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: <ok, error>(
    a: (a: ok) => ReadonlyArray<number>,
    b: (a: error) => ReadonlyArray<number>
  ) => (a: Result<ok, error>) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からResultにデコードする
   */
  readonly decode: <ok, error>(
    a: (
      a: number,
      b: Uint8Array
    ) => { readonly result: ok; readonly nextIndex: number },
    b: (
      a: number,
      b: Uint8Array
    ) => { readonly result: error; readonly nextIndex: number }
  ) => (
    a: number,
    b: Uint8Array
  ) => { readonly result: Result<ok, error>; readonly nextIndex: number };
} = {
  Ok: <ok, error>(ok: ok): Result<ok, error> => ({ _: "Ok", ok: ok }),
  Error: <ok, error>(error: error): Result<ok, error> => ({
    _: "Error",
    error: error,
  }),
  encode: (): {} => {},
  decode: (): Result => {},
};

/**
 * 型
 */
export const Type: {
  /**
   * -9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲
   */
  readonly Int: Type;
  /**
   * 文字列
   */
  readonly String: Type;
  /**
   * 真偽値
   */
  readonly Bool: Type;
  /**
   * リスト
   */
  readonly List: (a: Type) => Type;
  /**
   * Maybe
   */
  readonly Maybe: (a: Type) => Type;
  /**
   * Result
   */
  readonly Result: (a: ResultType) => Type;
  /**
   * データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字
   */
  readonly Id: (a: string) => Type;
  /**
   * データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字
   */
  readonly Token: (a: string) => Type;
  /**
   * 用意されていないアプリ特有の型
   */
  readonly Custom: (a: string) => Type;
  /**
   * 型パラメーター
   */
  readonly Parameter: (a: string) => Type;
  /**
   * Typeを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: Type) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からTypeにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: Type; readonly nextIndex: number };
} = {
  Int: { _: "Int" },
  String: { _: "String" },
  Bool: { _: "Bool" },
  List: (type_: Type): Type => ({ _: "List", type_: type_ }),
  Maybe: (type_: Type): Type => ({ _: "Maybe", type_: type_ }),
  Result: (resultType: ResultType): Type => ({
    _: "Result",
    resultType: resultType,
  }),
  Id: (string_: string): Type => ({ _: "Id", string_: string_ }),
  Token: (string_: string): Type => ({ _: "Token", string_: string_ }),
  Custom: (string_: string): Type => ({ _: "Custom", string_: string_ }),
  Parameter: (string_: string): Type => ({ _: "Parameter", string_: string_ }),
  encode: (): {} => {},
  decode: (): Type => {},
};

/**
 * 正常値と異常値
 */
export const ResultType: {
  /**
   * ResultTypeを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: ResultType) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からResultTypeにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: ResultType; readonly nextIndex: number };
} = {
  encode: (value: ResultType): ReadonlyArray<number> =>
    Type.encode(value.ok).concat(Type.encode(value.error)),
  decode: (): ResultType => {},
};

/**
 * デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる
 */
export const UrlData: {
  /**
   * UrlDataを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: UrlData) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からUrlDataにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: UrlData; readonly nextIndex: number };
} = {
  encode: (value: UrlData): ReadonlyArray<number> =>
    ClientMode.encode(value.clientMode)
      .concat(Location.encode(value.location))
      .concat(Language.encode(value.language))
      .concat(Maybe.encode(AccessToken.encode)(value.accessToken))
      .concat("Boolをエンコードする関数"(value["if"])),
  decode: (): UrlData => {},
};

/**
 * デバッグの状態と, デバッグ時ならアクセスしているポート番号
 */
export const ClientMode: {
  /**
   * デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの
   */
  readonly DebugMode: (a: number) => ClientMode;
  /**
   * リリースモード. https://definy.app
   */
  readonly Release: ClientMode;
  /**
   * ClientModeを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: ClientMode) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からClientModeにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: ClientMode; readonly nextIndex: number };
} = {
  DebugMode: (int32: number): ClientMode => ({ _: "DebugMode", int32: int32 }),
  Release: { _: "Release" },
  encode: (): {} => {},
  decode: (): ClientMode => {},
};

/**
 * DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる
 */
export const Location: {
  /**
   * 最初のページ
   */
  readonly Home: Location;
  /**
   * ユーザーの詳細ページ
   */
  readonly User: (a: UserId) => Location;
  /**
   * プロジェクトの詳細ページ
   */
  readonly Project: (a: ProjectId) => Location;
  /**
   * Locationを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: Location) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からLocationにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: Location; readonly nextIndex: number };
} = {
  Home: { _: "Home" },
  User: (userId: UserId): Location => ({ _: "User", userId: userId }),
  Project: (projectId: ProjectId): Location => ({
    _: "Project",
    projectId: projectId,
  }),
  encode: (): {} => {},
  decode: (): Location => {},
};

/**
 * 英語,日本語,エスペラント語などの言語
 */
export const Language: {
  /**
   * 日本語
   */
  readonly Japanese: Language;
  /**
   * 英語
   */
  readonly English: Language;
  /**
   * エスペラント語
   */
  readonly Esperanto: Language;
  /**
   * Languageを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: Language) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からLanguageにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: Language; readonly nextIndex: number };
} = {
  Japanese: "Japanese",
  English: "English",
  Esperanto: "Esperanto",
  encode: (): {} => {},
  decode: (): Language => {},
};

/**
 * プロジェクト
 */
export const Project: {
  /**
   * Projectを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: (a: Project) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からProjectにデコードする
   */
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: Project; readonly nextIndex: number };
} = {
  encode: (value: Project): ReadonlyArray<number> =>
    "Stringをエンコードする関数"(value.name)
      .concat(FileHash.encode(value.icon))
      .concat(FileHash.encode(value.image)),
  decode: (): Project => {},
};

/**
 * Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス
 */
export const ResponseWithId: {
  /**
   * ResponseWithIdを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: <id, data>(
    a: (a: id) => ReadonlyArray<number>,
    b: (a: data) => ReadonlyArray<number>
  ) => (a: ResponseWithId<id, data>) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からResponseWithIdにデコードする
   */
  readonly decode: <id, data>(
    a: (
      a: number,
      b: Uint8Array
    ) => { readonly result: id; readonly nextIndex: number },
    b: (
      a: number,
      b: Uint8Array
    ) => { readonly result: data; readonly nextIndex: number }
  ) => (
    a: number,
    b: Uint8Array
  ) => {
    readonly result: ResponseWithId<id, data>;
    readonly nextIndex: number;
  };
} = {
  encode: (value: ResponseWithId): ReadonlyArray<number> =>
    "parameterどうすれば良いのだろう?"(value.id).concat(
      Response.encode(value.response)
    ),
  decode: (): ResponseWithId => {},
};

/**
 * リソースをリクエストしたあとのレスポンス
 */
export const Response: {
  /**
   * オフラインかサーバー上でエラーが発生しました
   */
  readonly ConnectionError: <data>() => Response<data>;
  /**
   * リソースが存在しない
   */
  readonly NotFound: <data>() => Response<data>;
  /**
   * 取得に成功した
   */
  readonly Found: <data>(a: data) => Response<data>;
  /**
   * Responseを@narumincho/typeのバイナリ形式にエンコードする
   */
  readonly encode: <data>(
    a: (a: data) => ReadonlyArray<number>
  ) => (a: Response<data>) => ReadonlyArray<number>;
  /**
   * @narumincho/typeのバイナリ形式からResponseにデコードする
   */
  readonly decode: <data>(
    a: (
      a: number,
      b: Uint8Array
    ) => { readonly result: data; readonly nextIndex: number }
  ) => (
    a: number,
    b: Uint8Array
  ) => { readonly result: Response<data>; readonly nextIndex: number };
} = {
  ConnectionError: <data>(): Response<data> => ({ _: "ConnectionError" }),
  NotFound: <data>(): Response<data> => ({ _: "NotFound" }),
  Found: <data>(data: data): Response<data> => ({ _: "Found", data: data }),
  encode: (): {} => {},
  decode: (): Response => {},
};
