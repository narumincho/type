import { TextDecoder, TextEncoder } from "util";

/*
 * 各データのエンコーダ、デコーダーが書かれている
 */

/**
 * UnsignedLeb128で表現されたバイナリに変換する
 */
export const encodeUInt32 = (num: number): ReadonlyArray<number> => {
  num = Math.floor(Math.max(0, Math.min(num, 2 ** 32 - 1)));
  const numberArray = [];
  while (true) {
    const b = num & 0x7f;
    num = num >>> 7;
    if (num === 0) {
      numberArray.push(b);
      return numberArray;
    }
    numberArray.push(b | 0x80);
  }
};

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換する
 */
export const decodeUInt32 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let result = 0;

  for (let i = 0; i < 5; i++) {
    const b = binary[index + i];

    result |= (b & 0x7f) << (7 * i);
    if ((b & 0x80) === 0 && 0 <= result && result < 2 ** 32 - 1) {
      return { result, nextIndex: index + i + 1 };
    }
  }
  throw new Error("larger than 32-bits");
};

export const encodeString = (text: string): ReadonlyArray<number> => {
  return Array.from(new TextEncoder().encode(text));
};

export const decodeString = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const length = decodeUInt32(index, binary);
  return {
    result: new TextDecoder().decode(
      binary.slice(
        index + length.nextIndex,
        index + length.nextIndex + length.result
      )
    ),
    nextIndex: index + length.nextIndex + length.result
  };
};

export const encodeBoolean = (value: boolean): ReadonlyArray<number> => [
  value ? 1 : 0
];

export const decodeBoolean = (
  index: number,
  binary: Uint8Array
): { result: boolean; nextIndex: number } => ({
  result: binary[index] !== 0,
  nextIndex: index + 1
});

export const encodeHash = (hash: string): ReadonlyArray<number> => {
  const result = [];
  for (let i = 0; i < 32; i++) {
    result[i] = Number.parseInt(hash.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

export const decodeHash = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => ({
  result: Array.from(binary.slice(index, index + 32))
    .map(n => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 32
});

export const encodeId = (id: string): ReadonlyArray<number> => {
  const result = [];
  for (let i = 0; i < 16; i++) {
    result[i] = Number.parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
};

export const decodeId = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => ({
  result: Array.from(binary.slice(index, index + 16))
    .map(n => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 16
});

export const encodeStringList = (
  list: ReadonlyArray<string>
): ReadonlyArray<number> => {
  let result: Array<number> = [];
  result = result.concat(encodeUInt32(list.length));
  for (const element of list) {
    result = result.concat(encodeString(element));
  }
  return result;
};

export const encodeList = <T>(
  list: ReadonlyArray<T>,
  encodeFunction: (input: T) => ReadonlyArray<number>
): ReadonlyArray<number> => {
  let result: Array<number> = [];
  for (const element of list) {
    result = result.concat(encodeFunction(element));
  }
  return result;
};

type UserId = string & { _userId: never };

type User = {
  id: UserId;
  name: string;
  age: number;
};

export const encodeUser = (user: User): ReadonlyArray<number> => {
  return encodeId(user.id)
    .concat(encodeString(user.name))
    .concat(encodeUInt32(user.age));
};

export const decodeUser = (
  index: number,
  binary: Uint8Array
): { result: User; nextIndex: number } => {
  const idAndIndex = decodeId(index, binary);
  const nameAndIndex = decodeString(idAndIndex.nextIndex, binary);
  const ageAndIndex = decodeUInt32(nameAndIndex.nextIndex, binary);
  return {
    result: {
      id: idAndIndex.result as UserId,
      name: nameAndIndex.result,
      age: ageAndIndex.result
    },
    nextIndex: ageAndIndex.nextIndex
  };
};
