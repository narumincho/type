import * as a from "util";
/**
 * Maybe
 */
export type Maybe<T> = { _: "Just"; value: T } | { _: "Nothing" };

/**
 * Result
 */
export type Result<ok, error> =
  | { _: "Ok"; ok: ok }
  | { _: "Error"; error: error };

/**
 * 型
 */
export type Type =
  | { _: "UInt32" }
  | { _: "String" }
  | { _: "Bool" }
  | { _: "DateTime" }
  | { _: "List"; type_: Type }
  | { _: "Maybe"; type_: Type }
  | { _: "Result"; resultType: ResultType }
  | { _: "Id"; string_: string }
  | { _: "Token"; string_: string }
  | { _: "Custom"; string_: string };

/**
 * 正常値と異常値
 */
export type ResultType = { ok: Type; error: Type };

/**
 * プログラミング言語
 */
export type Language = "TypeScript" | "JavaScript" | "Elm";

export type UserId = string & { _userId: never };

export type FileToken = string & { _fileToken: never };

/**
 *
 *
 */
export const maybeJust = <T>(value: T): Maybe<T> => ({
  _: "Just",
  value: value
});

/**
 *
 *
 */
export const maybeNothing = <T>(): Maybe<T> => ({ _: "Nothing" });

/**
 *
 *
 */
export const resultOk = <ok, error>(ok: ok): Result<ok, error> => ({
  _: "Ok",
  ok: ok
});

/**
 *
 *
 */
export const resultError = <ok, error>(error: error): Result<ok, error> => ({
  _: "Error",
  error: error
});

/**
 * 0～4294967295 32bit符号なし整数
 */
export const typeUInt32: Type = { _: "UInt32" };

/**
 * 文字列
 */
export const typeString: Type = { _: "String" };

/**
 * 真偽値
 */
export const typeBool: Type = { _: "Bool" };

/**
 * 日時
 */
export const typeDateTime: Type = { _: "DateTime" };

/**
 * リスト
 *
 */
export const typeList = (type_: Type): Type => ({ _: "List", type_: type_ });

/**
 * Maybe
 *
 */
export const typeMaybe = (type_: Type): Type => ({ _: "Maybe", type_: type_ });

/**
 * Result
 *
 */
export const typeResult = (resultType: ResultType): Type => ({
  _: "Result",
  resultType: resultType
});

/**
 * データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字
 *
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_
});

/**
 * データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字
 *
 */
export const typeToken = (string_: string): Type => ({
  _: "Token",
  string_: string_
});

/**
 * 用意されていないアプリ特有の型
 *
 */
export const typeCustom = (string_: string): Type => ({
  _: "Custom",
  string_: string_
});

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 *
 */
export const encodeUInt32 = (num: number): ReadonlyArray<number> => {
  num = Math.floor(Math.max(0, Math.min(num, 4294967295)));
  const numberArray: Array<number> = [];
  while (true) {
    const b: number = num & 127;
    num = num >>> 7;
    if (num === 0) {
      numberArray.push(b);
      return numberArray;
    }
    numberArray.push(b | 128);
  }
};

/**
 * stringからバイナリに変換する.
 *
 */
export const encodeString = (text: string): ReadonlyArray<number> =>
  Array["from"](
    new (process === undefined ? TextEncoder : a.TextEncoder)().encode(text)
  );

/**
 * boolからバイナリに変換する
 *
 */
export const encodeBool = (value: boolean): ReadonlyArray<number> => [
  value ? 1 : 0
];

/**
 *
 *
 */
export const encodeDateTime = (dateTime: Date): ReadonlyArray<number> =>
  encodeUInt32(Math.floor(dateTime.getTime() / 1000));

/**
 *
 *
 */
export const encodeList = <T>(
  encodeFunction: (a: T) => ReadonlyArray<number>
): ((a: ReadonlyArray<T>) => ReadonlyArray<number>) => (
  list: ReadonlyArray<T>
): ReadonlyArray<number> => {
  let result: Array<number> = [];
  for (const element of list) {
    result = result.concat(encodeFunction(element));
  }
  return result;
};

/**
 *
 *
 */
export const maybe = <T>(
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

/**
 *
 *
 */
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

/**
 *
 *
 */
export const encodeId = (id: string): ReadonlyArray<number> => {
  const result: Array<number> = [];
  for (let i = 0; i < 16; i += 1) {
    result[i] = Number.parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

/**
 *
 *
 */
export const encodeHashOrAccessToken = (id: string): ReadonlyArray<number> => {
  const result: Array<number> = [];
  for (let i = 0; i < 32; i += 1) {
    result[i] = Number.parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

/**
 *
 *
 */
export const encodeCustomType = (type_: Type): ReadonlyArray<number> => {
  switch (type_._) {
    case "UInt32": {
      return [0];
    }
    case "String": {
      return [1];
    }
    case "Bool": {
      return [2];
    }
    case "DateTime": {
      return [3];
    }
    case "List": {
      return [4].concat(encodeCustomType(type_.type_));
    }
    case "Maybe": {
      return [5].concat(encodeCustomType(type_.type_));
    }
    case "Result": {
      return [6].concat(encodeCustomResultType(type_.resultType));
    }
    case "Id": {
      return [7].concat(encodeString(type_.string_));
    }
    case "Token": {
      return [8].concat(encodeString(type_.string_));
    }
    case "Custom": {
      return [9].concat(encodeString(type_.string_));
    }
  }
};

/**
 *
 *
 */
export const encodeCustomResultType = (
  resultType: ResultType
): ReadonlyArray<number> =>
  encodeCustomType(resultType.ok).concat(encodeCustomType(resultType.error));

/**
 *
 *
 */
export const encodeCustomLanguage = (
  language: Language
): ReadonlyArray<number> => {
  switch (language) {
    case "TypeScript": {
      return [0];
    }
    case "JavaScript": {
      return [1];
    }
    case "Elm": {
      return [2];
    }
  }
};

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeUInt32 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let result: number = 0;
  for (let i = 0; i < 5; i += 1) {
    const b: number = binary[index + i];
    result |= (b & 127) << (7 * i);
    if ((b & 8) === 0 && 0 <= result && result < 4294967295) {
      return { result: result, nextIndex: index + i + 1 };
    }
  }
  throw new Error("larger than 32-bits");
};

/**
 * バイナリからstringに変換する.
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeString = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const length: { result: number; nextIndex: number } = decodeUInt32(
    index,
    binary
  );
  return {
    result: new (process === undefined ? TextDecoder : a.TextDecoder)().decode(
      binary.slice(
        index + length.nextIndex,
        index + length.nextIndex + length.result
      )
    ),
    nextIndex: index + length.nextIndex + length.result
  };
};

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeBool = (
  index: number,
  binary: Uint8Array
): { result: boolean; nextIndex: number } => ({
  result: binary[index] !== 0,
  nextIndex: index + 1
});

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeDateTime = (
  index: number,
  binary: Uint8Array
): { result: Date; nextIndex: number } => {
  const result: { result: number; nextIndex: number } = decodeUInt32(
    index,
    binary
  );
  return {
    result: new Date(result.result * 1000),
    nextIndex: result.nextIndex
  };
};

/**
 *
 *
 */
export const decodeList = <T>(
  decodeFunction: (a: number, b: Uint8Array) => { result: T; nextIndex: number }
): ((
  a: number,
  b: Uint8Array
) => { result: ReadonlyArray<T>; nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { result: ReadonlyArray<T>; nextIndex: number } => {
  const length: number = binary[index];
  const result: Array<T> = [];
  for (let i = 0; i < length; i += 1) {
    const resultAndNextIndex: { result: T; nextIndex: number } = decodeFunction(
      index,
      binary
    );
    result.push(resultAndNextIndex.result);
    index = resultAndNextIndex.nextIndex;
  }
  return { result: result, nextIndex: index };
};

/**
 *
 *
 */
export const decodeMaybe = <T>(
  decodeFunction: (a: number, b: Uint8Array) => { result: T; nextIndex: number }
): ((a: number, b: Uint8Array) => { result: Maybe<T>; nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { result: Maybe<T>; nextIndex: number } => {
  const patternIndexAndNextIndex: {
    result: number;
    nextIndex: number;
  } = decodeUInt32(index, binary);
  if (patternIndexAndNextIndex.result === 0) {
    const valueAndNextIndex: { result: T; nextIndex: number } = decodeFunction(
      patternIndexAndNextIndex.nextIndex,
      binary
    );
    return {
      result: maybeJust(valueAndNextIndex.result),
      nextIndex: valueAndNextIndex.nextIndex
    };
  }
  if (patternIndexAndNextIndex.result === 1) {
    return {
      result: maybeNothing(),
      nextIndex: patternIndexAndNextIndex.nextIndex
    };
  }
  throw new Error(
    "存在しないMaybeのパターンを受け取った. 型情報を更新してください"
  );
};

/**
 *
 *
 */
export const decodeResult = <ok, error>(
  okDecodeFunction: (
    a: number,
    b: Uint8Array
  ) => { result: ok; nextIndex: number },
  errorDecodeFunction: (
    a: number,
    b: Uint8Array
  ) => { result: error; nextIndex: number }
): ((
  a: number,
  b: Uint8Array
) => { result: Result<ok, error>; nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { result: Result<ok, error>; nextIndex: number } => {
  const patternIndexAndNextIndex: {
    result: number;
    nextIndex: number;
  } = decodeUInt32(index, binary);
  if (patternIndexAndNextIndex.result === 0) {
    const okAndNextIndex: { result: ok; nextIndex: number } = okDecodeFunction(
      patternIndexAndNextIndex.nextIndex,
      binary
    );
    return {
      result: resultOk(okAndNextIndex.result),
      nextIndex: okAndNextIndex.nextIndex
    };
  }
  if (patternIndexAndNextIndex.result === 1) {
    const errorAndNextIndex: {
      result: error;
      nextIndex: number;
    } = errorDecodeFunction(patternIndexAndNextIndex.nextIndex, binary);
    return {
      result: resultError(errorAndNextIndex.result),
      nextIndex: errorAndNextIndex.nextIndex
    };
  }
  throw new Error(
    "存在しないResultのパターンを受け取った. 型情報を更新してください"
  );
};

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeId = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => ({
  result: Array["from"](binary.slice(index, index + 16))
    .map((n: number): string => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 16
});

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeHashOrAccessToken = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => ({
  result: Array["from"](binary.slice(index, index + 32))
    .map((n: number): string => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 32
});

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeCustomType = (
  index: number,
  binary: Uint8Array
): { result: Type; nextIndex: number } => {
  const patternIndex: { result: number; nextIndex: number } = decodeUInt32(
    index,
    binary
  );
  if (patternIndex.result === 0) {
    return { result: typeUInt32, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 1) {
    return { result: typeString, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 2) {
    return { result: typeBool, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 3) {
    return { result: typeDateTime, nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 4) {
    const result: { result: Type; nextIndex: number } = decodeCustomType(
      patternIndex.nextIndex,
      binary
    );
    return { result: typeList(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 5) {
    const result: { result: Type; nextIndex: number } = decodeCustomType(
      patternIndex.nextIndex,
      binary
    );
    return { result: typeMaybe(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 6) {
    const result: {
      result: ResultType;
      nextIndex: number;
    } = decodeCustomResultType(patternIndex.nextIndex, binary);
    return { result: typeResult(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 7) {
    const result: { result: string; nextIndex: number } = decodeString(
      patternIndex.nextIndex,
      binary
    );
    return { result: typeId(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 8) {
    const result: { result: string; nextIndex: number } = decodeString(
      patternIndex.nextIndex,
      binary
    );
    return { result: typeToken(result.result), nextIndex: result.nextIndex };
  }
  if (patternIndex.result === 9) {
    const result: { result: string; nextIndex: number } = decodeString(
      patternIndex.nextIndex,
      binary
    );
    return { result: typeCustom(result.result), nextIndex: result.nextIndex };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeCustomResultType = (
  index: number,
  binary: Uint8Array
): { result: ResultType; nextIndex: number } => {
  const okAndNextIndex: { result: Type; nextIndex: number } = decodeCustomType(
    index,
    binary
  );
  const errorAndNextIndex: {
    result: Type;
    nextIndex: number;
  } = decodeCustomType(okAndNextIndex.nextIndex, binary);
  return {
    result: { ok: okAndNextIndex.result, error: errorAndNextIndex.result },
    nextIndex: errorAndNextIndex.nextIndex
  };
};

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 *
 */
export const decodeCustomLanguage = (
  index: number,
  binary: Uint8Array
): { result: Language; nextIndex: number } => {
  const patternIndex: { result: number; nextIndex: number } = decodeUInt32(
    index,
    binary
  );
  if (patternIndex.result === 0) {
    return { result: "TypeScript", nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 1) {
    return { result: "JavaScript", nextIndex: patternIndex.nextIndex };
  }
  if (patternIndex.result === 2) {
    return { result: "Elm", nextIndex: patternIndex.nextIndex };
  }
  throw new Error("存在しないパターンを指定された 型を更新してください");
};
