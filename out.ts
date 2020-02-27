import * as a from "util";
/**
 * 型
 */
export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Bool }
  | { _: Type_.DateTime }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Id; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.Token; string_: string }
  | { _: Type_.Custom; string_: string };
/**
 * キーと値
 */
export type DictionaryType = { key: Type; value: Type };
export const enum Type_ {
  UInt32 = 0,
  String = 1,
  Bool = 2,
  DateTime = 3,
  List = 4,
  Id = 5,
  Hash = 6,
  Token = 7,
  Custom = 8
}
/**
 * 0～4294967295 32bit符号なし整数

 */
export const typeUInt32 = (): Type => ({ _: Type_.UInt32 });

/**
 * 文字列

 */
export const typeString = (): Type => ({ _: Type_.String });

/**
 * 真偽値

 */
export const typeBool = (): Type => ({ _: Type_.Bool });

/**
 * 日時

 */
export const typeDateTime = (): Type => ({ _: Type_.DateTime });

/**
 * リスト
 * @param type_
 */
export const typeList = (type_: Type): Type => ({
  _: Type_.List,
  type_: type_
});

/**
 * Id. データを識別するためのもの. カスタムの型名を指定する
 * @param string_
 */
export const typeId = (string_: string): Type => ({
  _: Type_.Id,
  string_: string_
});

/**
 * Hash. データを識別するためのHash
 * @param string_
 */
export const typeHash = (string_: string): Type => ({
  _: Type_.Hash,
  string_: string_
});

/**
 * トークン. データへのアクセスをするために必要になるもの. トークンの種類の名前を指定する
 * @param string_
 */
export const typeToken = (string_: string): Type => ({
  _: Type_.Token,
  string_: string_
});

/**
 * 用意されていないアプリ特有の型
 * @param string_
 */
export const typeCustom = (string_: string): Type => ({
  _: Type_.Custom,
  string_: string_
});

/**
 *
 * @param type_
 */
export const encodeType = (type_: Type): ReadonlyArray<number> => {
  let b: Array<number> = [];
  b = b.concat(encodeUInt32(type_._));
  if (type_._ === Type_.List) {
    return b.concat(encodeType(type_.type_));
  }
  if (type_._ === Type_.Id) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.Hash) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.Token) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.Custom) {
    return b.concat(encodeString(type_.string_));
  }
  throw new Error("Type type tag index error. index = " + type_._.toString());
};

/**
 *
 * @param dictionaryType
 */
export const encodeDictionaryType = (
  dictionaryType: DictionaryType
): ReadonlyArray<number> =>
  encodeType(dictionaryType.key).concat(encodeType(dictionaryType.value));

/**
 * numberの32bit符号なし整数をUnsignedLeb128で表現されたバイナリに変換するコード
 * @param num
 */
export const encodeUInt32 = (num: number): ReadonlyArray<number> => {
  num = Math.floor(Math.max(0, Math.min(num, 4294967295)));
  const b: Array<number> = [];
  while (true) {
    const c: number = num & 127;
    num = num >>> 7;
    if (num === 0) {
      b.push(c);
      return b;
    }
    b.push(c | 128);
  }
};

/**
 * stringからバイナリに変換するコード. このコードはNode.js用なのでutilのTextDecoderを使う
 * @param text
 */
export const encodeString = (text: string): ReadonlyArray<number> =>
  Array["from"](new a.TextEncoder().encode(text));

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeType = (
  index: number,
  binary: Uint8Array
): { result: Type; nextIndex: number } => {};

/**
 *
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeDictionaryType = (
  index: number,
  binary: Uint8Array
): { result: DictionaryType; nextIndex: number } => {};

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeUInt32 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let b: number = 0;
  for (let c = 0; c < 5; c += 1) {
    const d: number = binary[index + c];
    b |= (d & 127) << (7 * c);
    if ((d & 8) === 0 && 0 <= b && b < 4294967295) {
      return { result: b, nextIndex: index + c + 1 };
    }
  }
  throw new Error("larger than 32-bits");
};

/**
 * バイナリからstringに変換する.このコードはNode.js用でutilのTextDecoderを使う
 * @param index バイナリを読み込み開始位置
 * @param binary バイナリ
 */
export const decodeString = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const b: { result: number; nextIndex: number } = decodeUInt32(index, binary);
  return {
    result: new a.TextDecoder().decode(
      binary.slice(index + b.nextIndex, index + b.nextIndex + b.result)
    ),
    nextIndex: index + b.nextIndex + b.result
  };
};
