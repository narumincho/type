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
  | { _: "Hash"; string_: string }
  | { _: "AccessToken" }
  | { _: "Custom"; string_: string };

/**
 * 正常値と異常値
 */
export type ResultType = { ok: Type; error: Type };

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
 * Id. データを識別するためのもの. カスタムの型名を指定する
 *
 */
export const typeId = (string_: string): Type => ({
  _: "Id",
  string_: string_
});

/**
 * Hash. データを識別するためのHash
 *
 */
export const typeHash = (string_: string): Type => ({
  _: "Hash",
  string_: string_
});

/**
 * トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する
 */
export const typeAccessToken: Type = { _: "AccessToken" };

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
 * stringからバイナリに変換する. このコードはNode.js用なのでutilのTextDecoderを使う
 *
 */
export const encodeString = (text: string): ReadonlyArray<number> =>
  Array["from"](new a.TextEncoder().encode(text));

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
  let result: Array<number> = [];
  result = result.concat(encodeUInt32(type_._));
  if (type_._ === "List") {
    return result.concat(encodeCustomType(type_.type_));
  }
  if (type_._ === "Maybe") {
    return result.concat(encodeCustomType(type_.type_));
  }
  if (type_._ === "Result") {
    return result.concat(encodeCustomResultType(type_.resultType));
  }
  if (type_._ === "Id") {
    return result.concat(encodeString(type_.string_));
  }
  if (type_._ === "Hash") {
    return result.concat(encodeString(type_.string_));
  }
  if (type_._ === "Custom") {
    return result.concat(encodeString(type_.string_));
  }
  throw new Error("Type type tag index error. index = " + type_._.toString());
};

/**
 *
 *
 */
export const encodeCustomResultType = (
  resultType: ResultType
): ReadonlyArray<number> =>
  encodeCustomType(resultType.ok).concat(encodeCustomType(resultType.error));
