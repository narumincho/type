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
  let a: Array<number> = [];
  a = a.concat(encodeUInt32(type_._));
  if (type_._ === 2) {
    return a.concat(encodeString(type_.string_));
  }
  if (type_._ === 3) {
    return a.concat(encodeString(type_.string_));
  }
  if (type_._ === 4) {
    return a.concat(encodeType(type_.type_));
  }
  if (type_._ === 5) {
    return a.concat(encodeString(type_.string_));
  }
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
  const a: Array<number> = [];
  while (true) {
    const b: number = num & 127;
    num = num >>> 7;
    if (num === 0) {
      a.push(b);
      return a;
    }
    a.push(b | 128);
  }
};
