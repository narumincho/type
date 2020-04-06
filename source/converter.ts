import { TextDecoder, TextEncoder } from "util";
import * as type from "./type";

/*
 * 各データのエンコーダ、デコーダーが書かれている
 */

/**
 * Signed Leb128で表現されたバイナリに変換する
 */
export const encodeInt32 = (value: number): ReadonlyArray<number> => {
  value |= 0;
  const result: Array<number> = [];
  while (true) {
    const byte = value & 0x7f;
    value >>= 7;
    if (
      (value === 0 && (byte & 0x40) === 0) ||
      (value === -1 && (byte & 0x40) !== 0)
    ) {
      result.push(byte);
      return result;
    }
    result.push(byte | 0x80);
  }
};

export const decodeInt32 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let result = 0;
  let offset = 0;
  while (true) {
    const byte = binary[index + offset];
    result |= (byte & 0x7f) << (offset * 7);
    offset += 1;
    if ((0x80 & byte) === 0) {
      if (offset * 7 < 32 && (byte & 0x40) !== 0) {
        return {
          result: result | (~0 << (offset * 7)),
          nextIndex: index + offset,
        };
      }
      return {
        result: result,
        nextIndex: index + offset,
      };
    }
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

/**
 * stringからバイナリに変換する.
 */
export const encodeString = (text: string): ReadonlyArray<number> => {
  const result: ReadonlyArray<number> = [...new TextEncoder().encode(text)];
  return encodeInt32(result.length).concat(result);
};

export const decodeString = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const length = decodeUInt32(index, binary);
  return {
    result: new TextDecoder().decode(
      binary.slice(length.nextIndex, length.nextIndex + length.result)
    ),
    nextIndex: length.nextIndex + length.result,
  };
};

export const encodeBoolean = (value: boolean): ReadonlyArray<number> => [
  value ? 1 : 0,
];

export const decodeBoolean = (
  index: number,
  binary: Uint8Array
): { result: boolean; nextIndex: number } => ({
  result: binary[index] !== 0,
  nextIndex: index + 1,
});

export const encodeBinary = (value: Uint8Array): ReadonlyArray<number> => {
  return encodeInt32(value.length).concat(Array.from(value));
};

export const decodeBinary = (
  index: number,
  binary: Uint8Array
): { result: Uint8Array; nextIndex: number } => {
  const length = decodeInt32(index, binary);
  const nextIndex = length.nextIndex + length.result;
  return {
    result: binary.slice(length.nextIndex, nextIndex),
    nextIndex: nextIndex,
  };
};

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
    .map((n) => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 32,
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
    .map((n) => n.toString(16).padStart(2, "0"))
    .join(""),
  nextIndex: index + 16,
});

export const encodeStringList = (
  list: ReadonlyArray<string>
): ReadonlyArray<number> => {
  let result: Array<number> = [];
  result = result.concat(encodeInt32(list.length));
  for (const element of list) {
    result = result.concat(encodeString(element));
  }
  return result;
};

export const encodeListCurry = <T>(
  encodeFunction: (input: T) => ReadonlyArray<number>
): ((list: ReadonlyArray<T>) => ReadonlyArray<number>) => (
  list: ReadonlyArray<T>
): ReadonlyArray<number> => {
  let result: Array<number> = [];
  for (const element of list) {
    result = result.concat(encodeFunction(element));
  }
  return result;
};

export const decodeList = <T>(
  decodeFunction: (
    index: number,
    binary: Uint8Array
  ) => { result: T; nextIndex: number }
): ((
  index: number,
  binary: Uint8Array
) => { result: ReadonlyArray<T>; nextIndex: number }) => (
  index: number,
  binary: Uint8Array
): { result: ReadonlyArray<T>; nextIndex: number } => {
  const length = binary[index];
  const result: Array<T> = [];
  for (let i = 0; i < length; i++) {
    const resultAndNextIndex = decodeFunction(index, binary);
    result.push(resultAndNextIndex.result);
    index = resultAndNextIndex.nextIndex;
  }
  return {
    result: result,
    nextIndex: index,
  };
};

export const encodeMaybe = <T>(
  encodeFunction: (input: T) => ReadonlyArray<number>
): ((maybe: type.Maybe<T>) => ReadonlyArray<number>) => (
  maybe: type.Maybe<T>
): ReadonlyArray<number> => {
  switch (maybe._) {
    case "Just":
      return [0].concat(encodeFunction(maybe.value));
    case "Nothing":
      return [1];
  }
};

export const decodeMaybe = <T>(
  decodeFunction: (
    index: number,
    binary: Uint8Array
  ) => { result: T; nextIndex: number }
) => (
  index: number,
  binary: Uint8Array
): { result: type.Maybe<T>; nextIndex: number } => {
  const patternIndexAndNextIndex = decodeUInt32(index, binary);
  switch (patternIndexAndNextIndex.result) {
    case 0: {
      const valueAndNextIndex = decodeFunction(
        patternIndexAndNextIndex.nextIndex,
        binary
      );
      return {
        result: type.maybeJust(valueAndNextIndex.result),
        nextIndex: valueAndNextIndex.nextIndex,
      };
    }
    case 1: {
      return {
        result: type.maybeNothing(),
        nextIndex: patternIndexAndNextIndex.nextIndex,
      };
    }
  }
  throw new Error(
    "存在しないMaybeのパターンを受け取った. 型情報を更新してください"
  );
};

export const decodeResult = <ok, error>(
  okDecodeFunction: (
    index: number,
    binary: Uint8Array
  ) => { result: ok; nextIndex: number },
  errorDecodeFunction: (
    index: number,
    binary: Uint8Array
  ) => { result: error; nextIndex: number }
) => (
  index: number,
  binary: Uint8Array
): { result: type.Result<ok, error>; nextIndex: number } => {
  const patternIndexAndNextIndex = decodeUInt32(index, binary);
  switch (patternIndexAndNextIndex.result) {
    case 0: {
      const okAndNextIndex = okDecodeFunction(
        patternIndexAndNextIndex.nextIndex,
        binary
      );
      return {
        result: type.resultOk(okAndNextIndex.result),
        nextIndex: okAndNextIndex.nextIndex,
      };
    }
    case 1: {
      const errorAndNextIndex = errorDecodeFunction(
        patternIndexAndNextIndex.nextIndex,
        binary
      );
      return {
        result: type.resultError(errorAndNextIndex.result),
        nextIndex: errorAndNextIndex.nextIndex,
      };
    }
  }
  throw new Error(
    "存在しないResultのパターンを受け取った. 型情報を更新してください"
  );
};

export const encodeResult = <ok, error>(
  okEncodeFunction: (input: ok) => ReadonlyArray<number>,
  errorEncodeFunction: (input: error) => ReadonlyArray<number>
): ((result: type.Result<ok, error>) => ReadonlyArray<number>) => (
  result: type.Result<ok, error>
): ReadonlyArray<number> => {
  switch (result._) {
    case "Ok":
      return [0].concat(okEncodeFunction(result.ok));
    case "Error":
      return [1].concat(errorEncodeFunction(result.error));
  }
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
    .concat(encodeInt32(user.age));
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
      age: ageAndIndex.result,
    },
    nextIndex: ageAndIndex.nextIndex,
  };
};
