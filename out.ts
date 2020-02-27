import * as a from "util";
/**
 * 型
 */
export type Type =
  | { _: Type_.UInt32 }
  | { _: Type_.String }
  | { _: Type_.TypedString; string_: string }
  | { _: Type_.IdSet; string_: string }
  | { _: Type_.HashSet; string_: string }
  | { _: Type_.IdMap; string_: string }
  | { _: Type_.Hash; string_: string }
  | { _: Type_.List; string_: string }
  | { _: Type_.Custom; string_: string };
/**
 * キーと値
 */
export type DictionaryType = { key: Type; value: Type };
export const enum Type_ {
  UInt32 = 0,
  String = 1,
  TypedString = 2,
  IdSet = 3,
  HashSet = 4,
  IdMap = 5,
  Hash = 6,
  List = 7,
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
 * 型付きの文字列
 * @param string_
 */
export const typeTypedString = (string_: string): Type => ({
  _: Type_.TypedString,
  string_: string_
});

/**
 * Idの順番あり集合.
 * @param string_
 */
export const typeIdSet = (string_: string): Type => ({
  _: Type_.IdSet,
  string_: string_
});

/**
 * Hashの順番あり集合
 * @param string_
 */
export const typeHashSet = (string_: string): Type => ({
  _: Type_.HashSet,
  string_: string_
});

/**
 * Idと本体、と取得日時
 * @param string_
 */
export const typeIdMap = (string_: string): Type => ({
  _: Type_.IdMap,
  string_: string_
});

/**
 * Hashと本体
 * @param string_
 */
export const typeHash = (string_: string): Type => ({
  _: Type_.Hash,
  string_: string_
});

/**
 * リスト
 * @param string_
 */
export const typeList = (string_: string): Type => ({
  _: Type_.List,
  string_: string_
});

/**
 * 用意されていないアプリ特有の型.
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
  if (type_._ === Type_.TypedString) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.IdSet) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.HashSet) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.IdMap) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.Hash) {
    return b.concat(encodeString(type_.string_));
  }
  if (type_._ === Type_.List) {
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
