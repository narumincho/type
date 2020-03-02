import * as a from "util";
/**
 * Maybe
 */
export type Maybe<T> = { _: "Just"; value: T } | { _: "Nothing" };

/**
 * Result
 */
export type Result<ok, error> = { _: "Ok"; ok: ok } | { _: "Error"; error: error };

/**
 * 型
 */
export type Type = { _: "UInt32" } | { _: "String" } | { _: "Bool" } | { _: "DateTime" } | { _: "List"; type_: Type } | { _: "Maybe"; type_: Type } | { _: "Result"; resultType: ResultType } | { _: "Id"; string_: string } | { _: "Hash"; string_: string } | { _: "AccessToken" } | { _: "Custom"; string_: string };

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
export const typeResult = (resultType: ResultType): Type => ({ _: "Result", resultType: resultType });

/**
 * Id. データを識別するためのもの. カスタムの型名を指定する
 *
 */
export const typeId = (string_: string): Type => ({ _: "Id", string_: string_ });

/**
 * Hash. データを識別するためのHash
 *
 */
export const typeHash = (string_: string): Type => ({ _: "Hash", string_: string_ });

/**
 * トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する
 */
export const typeAccessToken: Type = { _: "AccessToken" };

/**
 * 用意されていないアプリ特有の型
 *
 */
export const typeCustom = (string_: string): Type => ({ _: "Custom", string_: string_ });

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
export const encodeString = (text: string): ReadonlyArray<number> => (Array["from"](new a.TextEncoder().encode(text)));

/**
 * boolからバイナリに変換する
 *
 */
export const encodeBool = (value: boolean): ReadonlyArray<number> => [value?1:0];


