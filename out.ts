import * as a from "util";
/**
 * 型
 */
export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.Id; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.List; type_: Type }
  | { _: Type_.Custom; string_: string };
/**
 * キーと値
 */
export type DictionaryType = { key: Type; value: Type };
export const enum Type_ {
  UInt32 = 0,
  String = 1,
  Id = 2,
  Hash = 3,
  List = 4,
  Custom = 5
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
 * Id
 * @param string_
 */
export const typeId = (string_: string): Type => ({
  _: Type_.Id,
  string_: string_
});

/**
 * データを識別するもので, データに応じて1つに決まる。
 * @param string_
 */
export const typeHash = (string_: string): Type => ({
  _: Type_.Hash,
  string_: string_
});

/**
 * リスト. 複数の要素を表現する
 * @param type_
 */
export const typeList = (type_: Type): Type => ({
  _: Type_.List,
  type_: type_
});

/**
 * 用意されていない型.
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
  if (type_._ === Type_.Id) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.Hash) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.List) {
    return b.concat(encodeType(type_.type_));
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
