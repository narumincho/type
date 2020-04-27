import * as a from "util";

/**
 * Maybe
 */
export type Maybe<T> =
  | { readonly _: "Just"; readonly value: T }
  | { readonly _: "Nothing" };

/**
 * Result
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
  | { readonly _: "Custom"; readonly string_: string };

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
 * 英語,日本語,エスペラント語などの言語
 */
export type Language = "Japanese" | "English" | "Esperanto";

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

export type AccessToken = string & { readonly _accessToken: never };

export type UserId = string & { readonly _userId: never };

export type ProjectId = string & { readonly _projectId: never };

export type FileHash = string & { readonly _fileHash: never };

export const maybeJust = <T>(value: T): Maybe<T> => ({
  _: "Just",
  value: value,
});

export const maybeNothing = <T>(): Maybe<T> => ({ _: "Nothing" });

export const resultOk = <ok, error>(ok: ok): Result<ok, error> => ({
  _: "Ok",
  ok: ok,
});

export const resultError = <ok, error>(error: error): Result<ok, error> => ({
  _: "Error",
  error: error,
});

/**
 * -9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲
 */
export const typeInt: Type = { _: "Int" };

/**
 * 文字列
 */
export const typeString: Type = { _: "String" };

/**
 * 真偽値
 */
export const typeBool: Type = { _: "Bool" };

/**
 * リスト
 */
export const typeList = (type_: Type): Type => ({ _: "List", type_: type_ });

/**
 * Maybe
 */
export const typeMaybe = (type_: Type): Type => ({ _: "Maybe", type_: type_ });

/**
 * Result
 */
export const typeResult = (resultType: ResultType): Type => ({
  _: "Result",
  resultType: resultType,
});

/**
 * データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_,
});

/**
 * データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字
 */
export const typeToken = (string_: string): Type => ({
  _: "Token",
  string_: string_,
});

/**
 * 用意されていないアプリ特有の型
 */
export const typeCustom = (string_: string): Type => ({
  _: "Custom",
  string_: string_,
});

/**
 * デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの
 */
export const clientModeDebugMode = (int32: number): ClientMode => ({
  _: "DebugMode",
  int32: int32,
});

/**
 * リリースモード. https://definy.app
 */
export const clientModeRelease: ClientMode = { _: "Release" };

/**
 * 最初のページ
 */
export const locationHome: Location = { _: "Home" };

/**
 * ユーザーの詳細ページ
 */
export const locationUser = (userId: UserId): Location => ({
  _: "User",
  userId: userId,
});

/**
 * プロジェクトの詳細ページ
 */
export const locationProject = (projectId: ProjectId): Location => ({
  _: "Project",
  projectId: projectId,
});

/**
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換する
 */
export const encodeInt32 = (value: number): ReadonlyArray<number> => {
  value |= 0;
  const result: Array<number> = [];
  while (true) {
    const byte: number = value & 127;
    value >>= 7;
    if (
      (value === 0 && (byte & 64) === 0) ||
      (value === -1 && (byte & 64) !== 0)
    ) {
      result.push(byte);
      return result;
    }
    result.push(byte | 128);
  }
};

/**
 * stringからバイナリに変換する.
 */
export const encodeString = (text: string): ReadonlyArray<number> => {
  const result: ReadonlyArray<number> = [
    ...new (process === undefined || process.title === "browser"
      ? TextEncoder
      : a.TextEncoder)().encode(text),
  ];
  return encodeInt32(result.length).concat(result);
};

/**
 * boolからバイナリに変換する
 */
export const encodeBool = (value: boolean): ReadonlyArray<number> => [
  value ? 1 : 0,
];

export const encodeBinary = (value: Uint8Array): ReadonlyArray<number> =>
  encodeInt32(value.length).concat([...value]);

export const encodeList = <T>(
  encodeFunction: (a: T) => ReadonlyArray<number>
): ((a: ReadonlyArray<T>) => ReadonlyArray<number>) => (
  list: ReadonlyArray<T>
): ReadonlyArray<number> => {
  let result: Array<number> = encodeInt32(list.length) as Array<number>;
  for (const element of list) {
    result = result.concat(encodeFunction(element));
  }
  return result;
};

export const encodeMaybe = <T>(
  encodeFunction: (a: T) => ReadonlyArray<number>
): ((a: Maybe<T>) => ReadonlyArray<number>) => (
  maybe: Maybe<T>
): ReadonlyArray<number> => {
  switch (maybe._) {
    case "Just": {
      return [0].concat(encodeFunction(maybe.value));
    }
    case "Nothing": {
      return [1];
    }
  }
};

export const encodeResult = <ok, error>(
  okEncodeFunction: (a: ok) => ReadonlyArray<number>,
  errorEncodeFunction: (a: error) => ReadonlyArray<number>
): ((a: Result<ok, error>) => ReadonlyArray<number>) => (
  result: Result<ok, error>
): ReadonlyArray<number> => {
  switch (result._) {
    case "Ok": {
      return [0].concat(okEncodeFunction(result.ok));
    }
    case "Error": {
      return [1].concat(errorEncodeFunction(result.error));
    }
  }
};

export const encodeId = (id: string): ReadonlyArray<number> => {
  const result: Array<number> = [];
  for (let i = 0; i < 16; i += 1) {
    result[i] = Number.parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

export const encodeToken = (id: string): ReadonlyArray<number> => {
  const result: Array<number> = [];
  for (let i = 0; i < 32; i += 1) {
    result[i] = Number.parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

export const encodeType = (type_: Type): ReadonlyArray<number> => {
  switch (type_._) {
    case "Int": {
      return [0];
    }
    case "String": {
      return [1];
    }
    case "Bool": {
      return [2];
    }
    case "List": {
      return [3].concat(encodeType(type_.type_));
    }
    case "Maybe": {
      return [4].concat(encodeType(type_.type_));
    }
    case "Result": {
      return [5].concat(encodeResultType(type_.resultType));
    }
    case "Id": {
      return [6].concat(encodeString(type_.string_));
    }
    case "Token": {
      return [7].concat(encodeString(type_.string_));
    }
    case "Custom": {
      return [8].concat(encodeString(type_.string_));
    }
  }
};

export const encodeResultType = (
  resultType: ResultType
): ReadonlyArray<number> =>
  encodeType(resultType.ok).concat(encodeType(resultType.error));

export const encodeLanguage = (language: Language): ReadonlyArray<number> => {
  switch (language) {
    case "Japanese": {
      return [0];
    }
    case "English": {
      return [1];
    }
    case "Esperanto": {
      return [2];
    }
  }
};

export const encodeUrlData = (urlData: UrlData): ReadonlyArray<number> =>
  encodeClientMode(urlData.clientMode)
    .concat(encodeLocation(urlData.location))
    .concat(encodeLanguage(urlData.language))
    .concat(encodeMaybe(encodeToken)(urlData.accessToken))
    .concat(encodeBool(urlData["if"]));

export const encodeClientMode = (
  clientMode: ClientMode
): ReadonlyArray<number> => {
  switch (clientMode._) {
    case "DebugMode": {
      return [0].concat(encodeInt32(clientMode.int32));
    }
    case "Release": {
      return [1];
    }
  }
};

export const encodeLocation = (location: Location): ReadonlyArray<number> => {
  switch (location._) {
    case "Home": {
      return [0];
    }
    case "User": {
      return [1].concat(encodeId(location.userId));
    }
    case "Project": {
      return [2].concat(encodeId(location.projectId));
    }
  }
};

export const encodeProject = (project: Project): ReadonlyArray<number> =>
  encodeString(project.name)
    .concat(encodeToken(project.icon))
    .concat(encodeToken(project.image));

/**
 * SignedLeb128で表現されたバイナリをnumberのビット演算ができる32bit符号付き整数の範囲の数値に変換するコード
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeInt32 = (
  index: number,
  binary: Uint8Array
): { readonly result: number; readonly nextIndex: number } => {
  let result: number = 0;
  let offset: number = 0;
  while (true) {
    const byte: number = binary[index + offset];
    result |= (byte & 127) << (offset * 7);
    offset += 1;
    if ((128 & byte) === 0) {
      if (offset * 7 < 32 && (byte & 64) !== 0) {
        return {
          result: result | (~0 << (offset * 7)),
          nextIndex: index + offset,
        };
      }
      return { result: result, nextIndex: index + offset };
    }
  }
};

/**
 * バイナリからstringに変換する.
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeString = (
  index: number,
  binary: Uint8Array
): { readonly result: string; readonly nextIndex: number } => {
  const length: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  const nextIndex: number = length.nextIndex + length.result;
  const textBinary: Uint8Array = binary.slice(length.nextIndex, nextIndex);
  const isBrowser: boolean =
    process === undefined || process.title === "browser";
  if (isBrowser) {
    return {
      result: new TextDecoder().decode(textBinary),
      nextIndex: nextIndex,
    };
  }
  return {
    result: new a.TextDecoder().decode(textBinary),
    nextIndex: nextIndex,
  };
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeBool = (
  index: number,
  binary: Uint8Array
): { readonly result: boolean; readonly nextIndex: number } => ({
  result: binary[index] !== 0,
  nextIndex: index + 1,
});

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeBinary = (
  index: number,
  binary: Uint8Array
): { readonly result: Uint8Array; readonly nextIndex: number } => {
  const length: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  const nextIndex: number = length.nextIndex + length.result;
  return {
    result: binary.slice(length.nextIndex, nextIndex),
    nextIndex: nextIndex,
  };
};

export const decodeList = <T>(
  decodeFunction: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number }
): ((
  a: number,
  b: Uint8Array
) => { readonly result: ReadonlyArray<T>; readonly nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { readonly result: ReadonlyArray<T>; readonly nextIndex: number } => {
  const lengthResult: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  index = lengthResult.nextIndex;
  const result: Array<T> = [];
  for (let i = 0; i < lengthResult.result; i += 1) {
    const resultAndNextIndex: {
      readonly result: T;
      readonly nextIndex: number;
    } = decodeFunction(index, binary);
    result.push(resultAndNextIndex.result);
    index = resultAndNextIndex.nextIndex;
  }
  return { result: result, nextIndex: index };
};

export const decodeMaybe = <T>(
  decodeFunction: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number }
): ((
  a: number,
  b: Uint8Array
) => { readonly result: Maybe<T>; readonly nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { readonly result: Maybe<T>; readonly nextIndex: number } => {
  const patternIndexAndNextIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndexAndNextIndex.result === 0) {
    const valueAndNextIndex: {
      readonly result: T;
      readonly nextIndex: number;
    } = decodeFunction(patternIndexAndNextIndex.nextIndex, binary);
    return {
      result: maybeJust(valueAndNextIndex.result),
      nextIndex: valueAndNextIndex.nextIndex,
    };
  }
  if (patternIndexAndNextIndex.result === 1) {
    return {
      result: maybeNothing(),
      nextIndex: patternIndexAndNextIndex.nextIndex,
    };
  }
  throw new Error(
    "存在しないMaybeのパターンを受け取った. 型情報を更新してください"
  );
};

export const decodeResult = <ok, error>(
  okDecodeFunction: (
    a: number,
    b: Uint8Array
  ) => { readonly result: ok; readonly nextIndex: number },
  errorDecodeFunction: (
    a: number,
    b: Uint8Array
  ) => { readonly result: error; readonly nextIndex: number }
): ((
  a: number,
  b: Uint8Array
) => { readonly result: Result<ok, error>; readonly nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { readonly result: Result<ok, error>; readonly nextIndex: number } => {
  const patternIndexAndNextIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndexAndNextIndex.result === 0) {
    const okAndNextIndex: {
      readonly result: ok;
      readonly nextIndex: number;
    } = okDecodeFunction(patternIndexAndNextIndex.nextIndex, binary);
    return {
      result: resultOk(okAndNextIndex.result),
      nextIndex: okAndNextIndex.nextIndex,
    };
  }
  if (patternIndexAndNextIndex.result === 1) {
    const errorAndNextIndex: {
      readonly result: error;
      readonly nextIndex: number;
    } = errorDecodeFunction(patternIndexAndNextIndex.nextIndex, binary);
    return {
      result: resultError(errorAndNextIndex.result),
      nextIndex: errorAndNextIndex.nextIndex,
    };
  }
  throw new Error(
    "存在しないResultのパターンを受け取った. 型情報を更新してください"
  );
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeId = (
  index: number,
  binary: Uint8Array
): { readonly result: string; readonly nextIndex: number } => ({
  result: [...binary.slice(index, index + 16)]
    .map((n: number): string => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 16,
});

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeToken = (
  index: number,
  binary: Uint8Array
): { readonly result: string; readonly nextIndex: number } => ({
  result: [...binary.slice(index, index + 32)]
    .map((n: number): string => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 32,
});

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeType = (
  index: number,
  binary: Uint8Array
): { readonly result: Type; readonly nextIndex: number } => {
  const patternIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndex.result === 0) {
    return { result: typeInt, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 1) {
    return { result: typeString, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 2) {
    return { result: typeBool, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 3) {
    const result: {
      readonly result: Type;
      readonly nextIndex: number;
    } = decodeType(patternIndex.nextIndex, binary);
    return { result: typeList(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 4) {
    const result: {
      readonly result: Type;
      readonly nextIndex: number;
    } = decodeType(patternIndex.nextIndex, binary);
    return { result: typeMaybe(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 5) {
    const result: {
      readonly result: ResultType;
      readonly nextIndex: number;
    } = decodeResultType(patternIndex.nextIndex, binary);
    return { result: typeResult(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 6) {
    const result: {
      readonly result: string;
      readonly nextIndex: number;
    } = decodeString(patternIndex.nextIndex, binary);
    return { result: typeId(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 7) {
    const result: {
      readonly result: string;
      readonly nextIndex: number;
    } = decodeString(patternIndex.nextIndex, binary);
    return { result: typeToken(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 8) {
    const result: {
      readonly result: string;
      readonly nextIndex: number;
    } = decodeString(patternIndex.nextIndex, binary);
    return { result: typeCustom(result.result), nextIndex: result.nextIndex };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeResultType = (
  index: number,
  binary: Uint8Array
): { readonly result: ResultType; readonly nextIndex: number } => {
  const okAndNextIndex: {
    readonly result: Type;
    readonly nextIndex: number;
  } = decodeType(index, binary);
  const errorAndNextIndex: {
    readonly result: Type;
    readonly nextIndex: number;
  } = decodeType(okAndNextIndex.nextIndex, binary);
  return {
    result: { ok: okAndNextIndex.result, error: errorAndNextIndex.result },
    nextIndex: errorAndNextIndex.nextIndex,
  };
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeLanguage = (
  index: number,
  binary: Uint8Array
): { readonly result: Language; readonly nextIndex: number } => {
  const patternIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndex.result === 0) {
    return { result: "Japanese", nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 1) {
    return { result: "English", nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 2) {
    return { result: "Esperanto", nextIndex: patternIndex.nextIndex };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeUrlData = (
  index: number,
  binary: Uint8Array
): { readonly result: UrlData; readonly nextIndex: number } => {
  const clientModeAndNextIndex: {
    readonly result: ClientMode;
    readonly nextIndex: number;
  } = decodeClientMode(index, binary);
  const locationAndNextIndex: {
    readonly result: Location;
    readonly nextIndex: number;
  } = decodeLocation(clientModeAndNextIndex.nextIndex, binary);
  const languageAndNextIndex: {
    readonly result: Language;
    readonly nextIndex: number;
  } = decodeLanguage(locationAndNextIndex.nextIndex, binary);
  const accessTokenAndNextIndex: {
    readonly result: Maybe<AccessToken>;
    readonly nextIndex: number;
  } = decodeMaybe(
    decodeToken as (
      a: number,
      b: Uint8Array
    ) => { readonly result: AccessToken; readonly nextIndex: number }
  )(languageAndNextIndex.nextIndex, binary);
  const ifAndNextIndex: {
    readonly result: boolean;
    readonly nextIndex: number;
  } = decodeBool(accessTokenAndNextIndex.nextIndex, binary);
  return {
    result: {
      clientMode: clientModeAndNextIndex.result,
      location: locationAndNextIndex.result,
      language: languageAndNextIndex.result,
      accessToken: accessTokenAndNextIndex.result,
      if: ifAndNextIndex.result,
    },
    nextIndex: ifAndNextIndex.nextIndex,
  };
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeClientMode = (
  index: number,
  binary: Uint8Array
): { readonly result: ClientMode; readonly nextIndex: number } => {
  const patternIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndex.result === 0) {
    const result: {
      readonly result: number;
      readonly nextIndex: number;
    } = decodeInt32(patternIndex.nextIndex, binary);
    return {
      result: clientModeDebugMode(result.result),
      nextIndex: result.nextIndex,
    };
  }
  if (patternIndex.result === 1) {
    return { result: clientModeRelease, nextIndex: patternIndex.nextIndex };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeLocation = (
  index: number,
  binary: Uint8Array
): { readonly result: Location; readonly nextIndex: number } => {
  const patternIndex: {
    readonly result: number;
    readonly nextIndex: number;
  } = decodeInt32(index, binary);
  if (patternIndex.result === 0) {
    return { result: locationHome, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 1) {
    const result: {
      readonly result: UserId;
      readonly nextIndex: number;
    } = (decodeId as (
      a: number,
      b: Uint8Array
    ) => { readonly result: UserId; readonly nextIndex: number })(
      patternIndex.nextIndex,
      binary
    );
    return { result: locationUser(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 2) {
    const result: {
      readonly result: ProjectId;
      readonly nextIndex: number;
    } = (decodeId as (
      a: number,
      b: Uint8Array
    ) => { readonly result: ProjectId; readonly nextIndex: number })(
      patternIndex.nextIndex,
      binary
    );
    return {
      result: locationProject(result.result),
      nextIndex: result.nextIndex,
    };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};

/**
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeProject = (
  index: number,
  binary: Uint8Array
): { readonly result: Project; readonly nextIndex: number } => {
  const nameAndNextIndex: {
    readonly result: string;
    readonly nextIndex: number;
  } = decodeString(index, binary);
  const iconAndNextIndex: {
    readonly result: FileHash;
    readonly nextIndex: number;
  } = (decodeToken as (
    a: number,
    b: Uint8Array
  ) => { readonly result: FileHash; readonly nextIndex: number })(
    nameAndNextIndex.nextIndex,
    binary
  );
  const imageAndNextIndex: {
    readonly result: FileHash;
    readonly nextIndex: number;
  } = (decodeToken as (
    a: number,
    b: Uint8Array
  ) => { readonly result: FileHash; readonly nextIndex: number })(
    iconAndNextIndex.nextIndex,
    binary
  );
  return {
    result: {
      name: nameAndNextIndex.result,
      icon: iconAndNextIndex.result,
      image: imageAndNextIndex.result,
    },
    nextIndex: imageAndNextIndex.nextIndex,
  };
};
