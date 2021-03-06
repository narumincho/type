/* eslint-disable */
/* generated by js-ts-code-generator. Do not edit! */

import * as a from "util";

/**
 * バイナリと相互変換するための関数
 */
export type Codec<T extends unknown> = {
  readonly encode: (a: T) => ReadonlyArray<number>;
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number };
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Maybe<value extends unknown> =
  | { readonly _: "Just"; readonly value: value }
  | { readonly _: "Nothing" };

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Result<ok extends unknown, error extends unknown> =
  | { readonly _: "Ok"; readonly ok: ok }
  | { readonly _: "Error"; readonly error: error };

/**
 * 型
 */
export type Type =
  | { readonly _: "Int" }
  | { readonly _: "String" }
  | { readonly _: "Bool" }
  | { readonly _: "List"; readonly type: Type }
  | { readonly _: "Maybe"; readonly type: Type }
  | { readonly _: "Result"; readonly resultType: ResultType }
  | { readonly _: "Id"; readonly string: string }
  | { readonly _: "Token"; readonly string: string }
  | { readonly _: "Custom"; readonly string: string }
  | { readonly _: "Parameter"; readonly string: string };

/**
 * 正常値と異常値
 */
export type ResultType = {
  /**
   * 正常値
   */
  readonly ok: Type;
  /**
   * 異常値
   */
  readonly error: Type;
};

/**
 * デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる
 */
export type UrlData = {
  /**
   * クライアントモード
   */
  readonly clientMode: ClientMode;
  /**
   * 場所
   */
  readonly location: Location;
  /**
   * 言語
   */
  readonly language: Language;
  /**
   * アクセストークン. ログインした後のリダイレクト先としてサーバーから渡される
   */
  readonly accessToken: Maybe<AccessToken>;
  /**
   * 予約語をこっそり入れてみる
   */
  readonly if: boolean;
};

/**
 * デバッグの状態と, デバッグ時ならアクセスしているポート番号
 */
export type ClientMode =
  | { readonly _: "DebugMode"; readonly int32: number }
  | { readonly _: "Release" };

/**
 * DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる
 */
export type Location =
  | { readonly _: "Home" }
  | { readonly _: "User"; readonly userId: UserId }
  | { readonly _: "Project"; readonly projectId: ProjectId };

/**
 * 英語,日本語,エスペラント語などの言語
 */
export type Language = "Japanese" | "English" | "Esperanto";

/**
 * プロジェクト
 */
export type Project = {
  /**
   * プロジェクト名
   */
  readonly name: string;
  /**
   * プロジェクトのアイコン画像
   */
  readonly icon: FileHash;
  /**
   * プロジェクトのカバー画像
   */
  readonly image: FileHash;
};

/**
 * Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス
 */
export type ResponseWithId<id extends unknown, data extends unknown> = {
  /**
   * リクエストしたリソースのID
   */
  readonly id: id;
  /**
   * レスポンス
   */
  readonly response: Response<data>;
};

/**
 * リソースをリクエストしたあとのレスポンス
 */
export type Response<data extends unknown> =
  | { readonly _: "ConnectionError" }
  | { readonly _: "NotFound" }
  | { readonly _: "Found"; readonly data: data };

/**
 * ユーザー
 */
export type User = {
  /**
   * ユーザー名. 表示される名前. 他のユーザーとかぶっても良い. 絵文字も使える. 全角英数は半角英数,半角カタカナは全角カタカナ, (株)の合字を分解するなどのNFKCの正規化がされる. U+0000-U+0019 と U+007F-U+00A0 の範囲の文字は入らない. 前後に空白を含められない. 間の空白は2文字以上連続しない. 文字数のカウント方法は正規化されたあとのCodePoint単位. Twitterと同じ, 1文字以上50文字以下
   */
  readonly name: string;
  /**
   * プロフィール画像
   */
  readonly imageHash: FileHash;
  /**
   * 自己紹介文. 改行文字を含めることができる. Twitterと同じ 0～160文字
   */
  readonly introduction: string;
};

export type UserId = string & { readonly _userId: never };

export type ProjectId = string & { readonly _projectId: never };

export type AccessToken = string & { readonly _accessToken: never };

export type FileHash = string & { readonly _fileHash: never };

/**
 * -2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う
 */
export const Int32: {
  /**
   * numberの32bit符号あり整数をSigned Leb128のバイナリに変換する
   */
  readonly codec: Codec<number>;
} = {
  codec: {
    encode: (value: number): ReadonlyArray<number> => {
      let rest: number = value | 0;
      const result: Array<number> = [];
      while (true) {
        const byte: number = rest & 127;
        rest >>= 7;
        if (
          (rest === 0 && (byte & 64) === 0) ||
          (rest === -1 && (byte & 64) !== 0)
        ) {
          result.push(byte);
          return result;
        }
        result.push(byte | 128);
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: number; readonly nextIndex: number } => {
      let result: number = 0;
      let offset: number = 0;
      while (true) {
        const byte: number = binary[index + offset];
        result |= (byte & 127) << (offset * 7);
        offset += 1;
        if ((128 & byte) === 0) {
          if (offset * 7 < 32 && (byte & 64) !== 0) {
            return {
              result: result | (~0 << (offset * 7)),
              nextIndex: index + offset,
            };
          }
          return { result, nextIndex: index + offset };
        }
      }
    },
  },
};

/**
 * 文字列. JavaScriptのstringで扱う
 */
export const String: {
  /**
   * stringをUTF-8のバイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: ReadonlyArray<number> = [
        ...new (process === undefined || process.title === "browser"
          ? TextEncoder
          : a.TextEncoder)().encode(value),
      ];
      return Int32.codec.encode(result.length).concat(result);
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => {
      const length: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      const nextIndex: number = length.nextIndex + length.result;
      const textBinary: Uint8Array = binary.slice(length.nextIndex, nextIndex);
      const isBrowser: boolean =
        process === undefined || process.title === "browser";
      if (isBrowser) {
        return { result: new TextDecoder().decode(textBinary), nextIndex };
      }
      return { result: new a.TextDecoder().decode(textBinary), nextIndex };
    },
  },
};

/**
 * Bool. 真か偽. JavaScriptのbooleanで扱える
 */
export const Bool: {
  /**
   * true: 1, false: 0. (1byte)としてバイナリに変換する
   */
  readonly codec: Codec<boolean>;
} = {
  codec: {
    encode: (value: boolean): ReadonlyArray<number> => [value ? 1 : 0],
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: boolean; readonly nextIndex: number } => ({
      result: binary[index] !== 0,
      nextIndex: index + 1,
    }),
  },
};

/**
 * バイナリ. JavaScriptのUint8Arrayで扱える
 */
export const Binary: {
  /**
   * 最初にLED128でバイト数, その次にバイナリそのまま
   */
  readonly codec: Codec<Uint8Array>;
} = {
  codec: {
    encode: (value: Uint8Array): ReadonlyArray<number> =>
      Int32.codec.encode(value.length).concat([...value]),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Uint8Array; readonly nextIndex: number } => {
      const length: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      const nextIndex: number = length.nextIndex + length.result;
      return { result: binary.slice(length.nextIndex, nextIndex), nextIndex };
    },
  },
};

/**
 * リスト. JavaScriptのArrayで扱う
 */
export const List: {
  readonly codec: <element extends unknown>(
    a: Codec<element>
  ) => Codec<ReadonlyArray<element>>;
} = {
  codec: <element extends unknown>(
    elementCodec: Codec<element>
  ): Codec<ReadonlyArray<element>> => ({
    encode: (value: ReadonlyArray<element>): ReadonlyArray<number> => {
      let result: Array<number> = Int32.codec.encode(value.length) as Array<
        number
      >;
      for (const element of value) {
        result = result.concat(elementCodec.encode(element));
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: ReadonlyArray<element>;
      readonly nextIndex: number;
    } => {
      const lengthResult: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      let nextIndex: number = lengthResult.nextIndex;
      const result: Array<element> = [];
      for (let i = 0; i < lengthResult.result; i += 1) {
        const resultAndNextIndex: {
          readonly result: element;
          readonly nextIndex: number;
        } = elementCodec.decode(nextIndex, binary);
        result.push(resultAndNextIndex.result);
        nextIndex = resultAndNextIndex.nextIndex;
      }
      return { result, nextIndex };
    },
  }),
};

/**
 * 16byteのバイナリ. JSでは 0-fの16進数の文字列として扱う
 */
export const Id: { readonly codec: Codec<string> } = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: Array<number> = [];
      for (let i = 0; i < 16; i += 1) {
        result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => ({
      result: [...binary.slice(index, index + 16)]
        .map((n: number): string => n.toString(16).padStart(2, "0"))
        .join(""),
      nextIndex: index + 16,
    }),
  },
};

/**
 * 32byteのバイナリ. JSでは 0-fの16進数の文字列として扱う
 */
export const Token: { readonly codec: Codec<string> } = {
  codec: {
    encode: (value: string): ReadonlyArray<number> => {
      const result: Array<number> = [];
      for (let i = 0; i < 32; i += 1) {
        result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
      }
      return result;
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: string; readonly nextIndex: number } => ({
      result: [...binary.slice(index, index + 32)]
        .map((n: number): string => n.toString(16).padStart(2, "0"))
        .join(""),
      nextIndex: index + 32,
    }),
  },
};

/**
 * URL. JavaScriptのURLで扱う
 */
export const Url: {
  /**
   * 文字列表現を直接入れる. URLコンストラクタでURLの形式かどうか調べる
   */
  readonly codec: Codec<URL>;
} = {
  codec: {
    encode: (value: URL): ReadonlyArray<number> =>
      String.codec.encode(value.toString()),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: URL; readonly nextIndex: number } => {
      const stringResult: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      return {
        result: new URL(stringResult.result),
        nextIndex: stringResult.nextIndex,
      };
    },
  },
};

/**
 * UserId
 */
export const UserId: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<UserId>;
} = {
  codec: {
    encode: Id.codec.encode,
    decode: Id.codec.decode as (
      a: number,
      b: Uint8Array
    ) => { readonly result: UserId; readonly nextIndex: number },
  },
};

/**
 * ProjectId
 */
export const ProjectId: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<ProjectId>;
} = {
  codec: {
    encode: Id.codec.encode,
    decode: Id.codec.decode as (
      a: number,
      b: Uint8Array
    ) => { readonly result: ProjectId; readonly nextIndex: number },
  },
};

/**
 * AccessToken
 */
export const AccessToken: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<AccessToken>;
} = {
  codec: {
    encode: Token.codec.encode,
    decode: Token.codec.decode as (
      a: number,
      b: Uint8Array
    ) => { readonly result: AccessToken; readonly nextIndex: number },
  },
};

/**
 * FileHash
 */
export const FileHash: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<FileHash>;
} = {
  codec: {
    encode: Token.codec.encode,
    decode: Token.codec.decode as (
      a: number,
      b: Uint8Array
    ) => { readonly result: FileHash; readonly nextIndex: number },
  },
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Maybe: {
  /**
   * 値があるということ
   */
  readonly Just: <value extends unknown>(a: value) => Maybe<value>;
  /**
   * 値がないということ
   */
  readonly Nothing: <value extends unknown>() => Maybe<value>;
  readonly codec: <value extends unknown>(
    a: Codec<value>
  ) => Codec<Maybe<value>>;
} = {
  Just: <value extends unknown>(value: value): Maybe<value> => ({
    _: "Just",
    value,
  }),
  Nothing: <value extends unknown>(): Maybe<value> => ({ _: "Nothing" }),
  codec: <value extends unknown>(
    valueCodec: Codec<value>
  ): Codec<Maybe<value>> => ({
    encode: (value: Maybe<value>): ReadonlyArray<number> => {
      switch (value._) {
        case "Just": {
          return [0].concat(valueCodec.encode(value.value));
        }
        case "Nothing": {
          return [1];
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Maybe<value>; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: value;
          readonly nextIndex: number;
        } = valueCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Maybe.Just(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        return { result: Maybe.Nothing(), nextIndex: patternIndex.nextIndex };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  }),
};

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Result: {
  /**
   * 成功
   */
  readonly Ok: <ok extends unknown, error extends unknown>(
    a: ok
  ) => Result<ok, error>;
  /**
   * 失敗
   */
  readonly Error: <ok extends unknown, error extends unknown>(
    a: error
  ) => Result<ok, error>;
  readonly codec: <ok extends unknown, error extends unknown>(
    a: Codec<ok>,
    b: Codec<error>
  ) => Codec<Result<ok, error>>;
} = {
  Ok: <ok extends unknown, error extends unknown>(
    ok: ok
  ): Result<ok, error> => ({ _: "Ok", ok }),
  Error: <ok extends unknown, error extends unknown>(
    error: error
  ): Result<ok, error> => ({ _: "Error", error }),
  codec: <ok extends unknown, error extends unknown>(
    okCodec: Codec<ok>,
    errorCodec: Codec<error>
  ): Codec<Result<ok, error>> => ({
    encode: (value: Result<ok, error>): ReadonlyArray<number> => {
      switch (value._) {
        case "Ok": {
          return [0].concat(okCodec.encode(value.ok));
        }
        case "Error": {
          return [1].concat(errorCodec.encode(value.error));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Result<ok, error>; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: ok;
          readonly nextIndex: number;
        } = okCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Result.Ok(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        const result: {
          readonly result: error;
          readonly nextIndex: number;
        } = errorCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Result.Error(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  }),
};

/**
 * 型
 */
export const Type: {
  /**
   * -9007199254740991～9007199254740991 JavaScriptのNumberで正確に表現できる整数の範囲
   */
  readonly Int: Type;
  /**
   * 文字列
   */
  readonly String: Type;
  /**
   * 真偽値
   */
  readonly Bool: Type;
  /**
   * リスト
   */
  readonly List: (a: Type) => Type;
  /**
   * Maybe
   */
  readonly Maybe: (a: Type) => Type;
  /**
   * Result
   */
  readonly Result: (a: ResultType) => Type;
  /**
   * データを識別するためのもの. カスタムの型名を指定する. 16byte. 16進数文字列で32文字
   */
  readonly Id: (a: string) => Type;
  /**
   * データを識別するため. カスタムの型名を指定する. 32byte. 16進数文字列で64文字
   */
  readonly Token: (a: string) => Type;
  /**
   * 用意されていないアプリ特有の型
   */
  readonly Custom: (a: string) => Type;
  /**
   * 型パラメーター
   */
  readonly Parameter: (a: string) => Type;
  readonly codec: Codec<Type>;
} = {
  Int: { _: "Int" },
  String: { _: "String" },
  Bool: { _: "Bool" },
  List: (type_: Type): Type => ({ _: "List", type: type_ }),
  Maybe: (type_: Type): Type => ({ _: "Maybe", type: type_ }),
  Result: (resultType: ResultType): Type => ({ _: "Result", resultType }),
  Id: (string_: string): Type => ({ _: "Id", string: string_ }),
  Token: (string_: string): Type => ({ _: "Token", string: string_ }),
  Custom: (string_: string): Type => ({ _: "Custom", string: string_ }),
  Parameter: (string_: string): Type => ({ _: "Parameter", string: string_ }),
  codec: {
    encode: (value: Type): ReadonlyArray<number> => {
      switch (value._) {
        case "Int": {
          return [0];
        }
        case "String": {
          return [1];
        }
        case "Bool": {
          return [2];
        }
        case "List": {
          return [3].concat(Type.codec.encode(value["type"]));
        }
        case "Maybe": {
          return [4].concat(Type.codec.encode(value["type"]));
        }
        case "Result": {
          return [5].concat(ResultType.codec.encode(value.resultType));
        }
        case "Id": {
          return [6].concat(String.codec.encode(value["string"]));
        }
        case "Token": {
          return [7].concat(String.codec.encode(value["string"]));
        }
        case "Custom": {
          return [8].concat(String.codec.encode(value["string"]));
        }
        case "Parameter": {
          return [9].concat(String.codec.encode(value["string"]));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Type; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        return { result: Type.Int, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 1) {
        return { result: Type.String, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 2) {
        return { result: Type.Bool, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 3) {
        const result: {
          readonly result: Type;
          readonly nextIndex: number;
        } = Type.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.List(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 4) {
        const result: {
          readonly result: Type;
          readonly nextIndex: number;
        } = Type.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Maybe(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 5) {
        const result: {
          readonly result: ResultType;
          readonly nextIndex: number;
        } = ResultType.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Result(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 6) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return { result: Type.Id(result.result), nextIndex: result.nextIndex };
      }
      if (patternIndex.result === 7) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Token(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 8) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Custom(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 9) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Parameter(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * 正常値と異常値
 */
export const ResultType: { readonly codec: Codec<ResultType> } = {
  codec: {
    encode: (value: ResultType): ReadonlyArray<number> =>
      Type.codec.encode(value.ok).concat(Type.codec.encode(value.error)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: ResultType; readonly nextIndex: number } => {
      const okAndNextIndex: {
        readonly result: Type;
        readonly nextIndex: number;
      } = Type.codec.decode(index, binary);
      const errorAndNextIndex: {
        readonly result: Type;
        readonly nextIndex: number;
      } = Type.codec.decode(okAndNextIndex.nextIndex, binary);
      return {
        result: { ok: okAndNextIndex.result, error: errorAndNextIndex.result },
        nextIndex: errorAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * デバッグモードかどうか,言語とページの場所. URLとして表現されるデータ. Googleなどの検索エンジンの都合( https://support.google.com/webmasters/answer/182192?hl=ja )で,URLにページの言語のを入れて,言語ごとに別のURLである必要がある. デバッグ時のホスト名は http://[::1] になる
 */
export const UrlData: { readonly codec: Codec<UrlData> } = {
  codec: {
    encode: (value: UrlData): ReadonlyArray<number> =>
      ClientMode.codec
        .encode(value.clientMode)
        .concat(Location.codec.encode(value.location))
        .concat(Language.codec.encode(value.language))
        .concat(Maybe.codec(AccessToken.codec).encode(value.accessToken))
        .concat(Bool.codec.encode(value["if"])),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: UrlData; readonly nextIndex: number } => {
      const clientModeAndNextIndex: {
        readonly result: ClientMode;
        readonly nextIndex: number;
      } = ClientMode.codec.decode(index, binary);
      const locationAndNextIndex: {
        readonly result: Location;
        readonly nextIndex: number;
      } = Location.codec.decode(clientModeAndNextIndex.nextIndex, binary);
      const languageAndNextIndex: {
        readonly result: Language;
        readonly nextIndex: number;
      } = Language.codec.decode(locationAndNextIndex.nextIndex, binary);
      const accessTokenAndNextIndex: {
        readonly result: Maybe<AccessToken>;
        readonly nextIndex: number;
      } = Maybe.codec(AccessToken.codec).decode(
        languageAndNextIndex.nextIndex,
        binary
      );
      const ifAndNextIndex: {
        readonly result: boolean;
        readonly nextIndex: number;
      } = Bool.codec.decode(accessTokenAndNextIndex.nextIndex, binary);
      return {
        result: {
          clientMode: clientModeAndNextIndex.result,
          location: locationAndNextIndex.result,
          language: languageAndNextIndex.result,
          accessToken: accessTokenAndNextIndex.result,
          if: ifAndNextIndex.result,
        },
        nextIndex: ifAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * デバッグの状態と, デバッグ時ならアクセスしているポート番号
 */
export const ClientMode: {
  /**
   * デバッグモード. ポート番号を保持する. オリジンは http://[::1]:2520 のようなもの
   */
  readonly DebugMode: (a: number) => ClientMode;
  /**
   * リリースモード. https://definy.app
   */
  readonly Release: ClientMode;
  readonly codec: Codec<ClientMode>;
} = {
  DebugMode: (int32: number): ClientMode => ({ _: "DebugMode", int32 }),
  Release: { _: "Release" },
  codec: {
    encode: (value: ClientMode): ReadonlyArray<number> => {
      switch (value._) {
        case "DebugMode": {
          return [0].concat(Int32.codec.encode(value.int32));
        }
        case "Release": {
          return [1];
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: ClientMode; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: number;
          readonly nextIndex: number;
        } = Int32.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: ClientMode.DebugMode(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        return {
          result: ClientMode.Release,
          nextIndex: patternIndex.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * DefinyWebアプリ内での場所を示すもの. URLから求められる. URLに変換できる
 */
export const Location: {
  /**
   * 最初のページ
   */
  readonly Home: Location;
  /**
   * ユーザーの詳細ページ
   */
  readonly User: (a: UserId) => Location;
  /**
   * プロジェクトの詳細ページ
   */
  readonly Project: (a: ProjectId) => Location;
  readonly codec: Codec<Location>;
} = {
  Home: { _: "Home" },
  User: (userId: UserId): Location => ({ _: "User", userId }),
  Project: (projectId: ProjectId): Location => ({ _: "Project", projectId }),
  codec: {
    encode: (value: Location): ReadonlyArray<number> => {
      switch (value._) {
        case "Home": {
          return [0];
        }
        case "User": {
          return [1].concat(UserId.codec.encode(value.userId));
        }
        case "Project": {
          return [2].concat(ProjectId.codec.encode(value.projectId));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Location; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        return { result: Location.Home, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 1) {
        const result: {
          readonly result: UserId;
          readonly nextIndex: number;
        } = UserId.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Location.User(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 2) {
        const result: {
          readonly result: ProjectId;
          readonly nextIndex: number;
        } = ProjectId.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Location.Project(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * 英語,日本語,エスペラント語などの言語
 */
export const Language: {
  /**
   * 日本語
   */
  readonly Japanese: Language;
  /**
   * 英語
   */
  readonly English: Language;
  /**
   * エスペラント語
   */
  readonly Esperanto: Language;
  readonly codec: Codec<Language>;
} = {
  Japanese: "Japanese",
  English: "English",
  Esperanto: "Esperanto",
  codec: {
    encode: (value: Language): ReadonlyArray<number> => {
      switch (value) {
        case "Japanese": {
          return [0];
        }
        case "English": {
          return [1];
        }
        case "Esperanto": {
          return [2];
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Language; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        return { result: Language.Japanese, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 1) {
        return { result: Language.English, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 2) {
        return {
          result: Language.Esperanto,
          nextIndex: patternIndex.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * プロジェクト
 */
export const Project: { readonly codec: Codec<Project> } = {
  codec: {
    encode: (value: Project): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(FileHash.codec.encode(value.icon))
        .concat(FileHash.codec.encode(value.image)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Project; readonly nextIndex: number } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const iconAndNextIndex: {
        readonly result: FileHash;
        readonly nextIndex: number;
      } = FileHash.codec.decode(nameAndNextIndex.nextIndex, binary);
      const imageAndNextIndex: {
        readonly result: FileHash;
        readonly nextIndex: number;
      } = FileHash.codec.decode(iconAndNextIndex.nextIndex, binary);
      return {
        result: {
          name: nameAndNextIndex.result,
          icon: iconAndNextIndex.result,
          image: imageAndNextIndex.result,
        },
        nextIndex: imageAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * Elmで扱えるように何のリソースのレスポンスかが含まれたレスポンス
 */
export const ResponseWithId: {
  readonly codec: <id extends unknown, data extends unknown>(
    a: Codec<id>,
    b: Codec<data>
  ) => Codec<ResponseWithId<id, data>>;
} = {
  codec: <id extends unknown, data extends unknown>(
    idCodec: Codec<id>,
    dataCodec: Codec<data>
  ): Codec<ResponseWithId<id, data>> => ({
    encode: (value: ResponseWithId<id, data>): ReadonlyArray<number> =>
      idCodec
        .encode(value.id)
        .concat(Response.codec(dataCodec).encode(value.response)),
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: ResponseWithId<id, data>;
      readonly nextIndex: number;
    } => {
      const idAndNextIndex: {
        readonly result: id;
        readonly nextIndex: number;
      } = idCodec.decode(index, binary);
      const responseAndNextIndex: {
        readonly result: Response<data>;
        readonly nextIndex: number;
      } = Response.codec(dataCodec).decode(idAndNextIndex.nextIndex, binary);
      return {
        result: {
          id: idAndNextIndex.result,
          response: responseAndNextIndex.result,
        },
        nextIndex: responseAndNextIndex.nextIndex,
      };
    },
  }),
};

/**
 * リソースをリクエストしたあとのレスポンス
 */
export const Response: {
  /**
   * オフラインかサーバー上でエラーが発生しました
   */
  readonly ConnectionError: <data extends unknown>() => Response<data>;
  /**
   * リソースが存在しない
   */
  readonly NotFound: <data extends unknown>() => Response<data>;
  /**
   * 取得に成功した
   */
  readonly Found: <data extends unknown>(a: data) => Response<data>;
  readonly codec: <data extends unknown>(
    a: Codec<data>
  ) => Codec<Response<data>>;
} = {
  ConnectionError: <data extends unknown>(): Response<data> => ({
    _: "ConnectionError",
  }),
  NotFound: <data extends unknown>(): Response<data> => ({ _: "NotFound" }),
  Found: <data extends unknown>(data: data): Response<data> => ({
    _: "Found",
    data,
  }),
  codec: <data extends unknown>(
    dataCodec: Codec<data>
  ): Codec<Response<data>> => ({
    encode: (value: Response<data>): ReadonlyArray<number> => {
      switch (value._) {
        case "ConnectionError": {
          return [0];
        }
        case "NotFound": {
          return [1];
        }
        case "Found": {
          return [2].concat(dataCodec.encode(value.data));
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Response<data>; readonly nextIndex: number } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        return {
          result: Response.ConnectionError(),
          nextIndex: patternIndex.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        return {
          result: Response.NotFound(),
          nextIndex: patternIndex.nextIndex,
        };
      }
      if (patternIndex.result === 2) {
        const result: {
          readonly result: data;
          readonly nextIndex: number;
        } = dataCodec.decode(patternIndex.nextIndex, binary);
        return {
          result: Response.Found(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  }),
};

/**
 * ユーザー
 */
export const User: { readonly codec: Codec<User> } = {
  codec: {
    encode: (value: User): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(FileHash.codec.encode(value.imageHash))
        .concat(String.codec.encode(value.introduction)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: User; readonly nextIndex: number } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const imageHashAndNextIndex: {
        readonly result: FileHash;
        readonly nextIndex: number;
      } = FileHash.codec.decode(nameAndNextIndex.nextIndex, binary);
      const introductionAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(imageHashAndNextIndex.nextIndex, binary);
      return {
        result: {
          name: nameAndNextIndex.result,
          imageHash: imageHashAndNextIndex.result,
          introduction: introductionAndNextIndex.result,
        },
        nextIndex: introductionAndNextIndex.nextIndex,
      };
    },
  },
};
