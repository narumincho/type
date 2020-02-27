import * as a from "util";
/**
 * 式
 */
export type Expr =
  | { _: Expr_.NumberLiteral; uInt32: number }
  | { _: Expr_.StringLiteral; string_: string };
export const enum Expr_ {
  NumberLiteral = 0,
  StringLiteral = 1
}
/**
 * numberList
 * @param uInt32
 */
export const exprNumberLiteral = (uInt32: number): Expr => ({
  _: Expr_.NumberLiteral,
  uInt32: uInt32
});

/**
 * stringLiteral
 * @param string_
 */
export const exprStringLiteral = (string_: string): Expr => ({
  _: Expr_.StringLiteral,
  string_: string_
});

/**
 *
 * @param expr
 */
export const encodeExpr = (expr: Expr): ReadonlyArray<number> => {
  let b: Array<number> = [];
  b = b.concat(encodeUInt32(expr._));
  if (expr._ === Expr_.NumberLiteral) {
    return b.concat(encodeUInt32(expr.uInt32));
  }
  if (expr._ === Expr_.StringLiteral) {
    return b.concat(encodeString(expr.string_));
  }
  throw new Error("Expr type tag index error. index = " + expr._.toString());
};

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
export const decodeExpr = (
  index: number,
  binary: Uint8Array
): { result: Expr; nextIndex: number } => {};

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
