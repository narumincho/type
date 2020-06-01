import * as a from "util";

/**
 * バイナリと相互変換するための関数
 */
export type Codec<T> = {
  readonly encode: (a: T) => ReadonlyArray<number>;
  readonly decode: (
    a: number,
    b: Uint8Array
  ) => { readonly result: T; readonly nextIndex: number };
};

/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Maybe<value> =
  | { readonly _: "Just"; readonly value: value }
  | { readonly _: "Nothing" };

/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export type Result<ok, error> =
  | { readonly _: "Ok"; readonly ok: ok }
  | { readonly _: "Error"; readonly error: error };

/**
 * 型
 */
export type Type =
  | { readonly _: "Int32" }
  | { readonly _: "String" }
  | { readonly _: "Bool" }
  | { readonly _: "Binary" }
  | { readonly _: "List"; readonly type_: Type }
  | { readonly _: "Maybe"; readonly type_: Type }
  | { readonly _: "Result"; readonly okAndErrorType: OkAndErrorType }
  | { readonly _: "Id"; readonly string_: string }
  | { readonly _: "Token"; readonly string_: string }
  | {
      readonly _: "Custom";
      readonly nameAndTypeParameterList: NameAndTypeParameterList;
    }
  | { readonly _: "Parameter"; readonly string_: string };

/**
 * 正常値と異常値
 */
export type OkAndErrorType = {
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
 * カスタム型の指定
 */
export type NameAndTypeParameterList = {
  /**
   * カスタム型名
   */
  readonly name: string;
  /**
   * 型パラメーター
   */
  readonly parameterList: ReadonlyArray<Type>;
};

/**
 * カスタム型の定義
 */
export type CustomTypeDefinition = {
  /**
   * 型の名前. [A-Z][a-zA-Z0-9]* の正規表現を満たせばOK
   */
  readonly name: string;
  /**
   * 型の説明. DOCコメントそしてコードに出力される
   */
  readonly description: string;
  /**
   * 型パラメーターは小文字で始めなければならない. Elmでの出力と外部の型を隠さないようにするため
   */
  readonly typeParameterList: ReadonlyArray<string>;
  /**
   * 型の定義の本体
   */
  readonly body: CustomTypeDefinitionBody;
};

/**
 * カスタム型の定義の本体
 */
export type CustomTypeDefinitionBody =
  | { readonly _: "Product"; readonly memberList: ReadonlyArray<Member> }
  | { readonly _: "Sum"; readonly patternList: ReadonlyArray<Pattern> };

/**
 * 直積型の構成要素. 名前と型を持つ
 */
export type Member = {
  /**
   * メンバー名
   */
  readonly name: string;
  /**
   * メンバーの説明
   */
  readonly description: string;
  /**
   * 型
   */
  readonly type: Type;
};

/**
 * 直和型の構成要素. タグと,パラメーターの型がついている
 */
export type Pattern = {
  /**
   * タグ名
   */
  readonly name: string;
  /**
   * パターンの説明
   */
  readonly description: string;
  /**
   * そのパターンにある型
   */
  readonly parameter: Maybe<Type>;
};

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
      value |= 0;
      const result: Array<number> = [];
      while (true) {
        const byte: number = value & 127;
        value >>= 7;
        if (
          (value === 0 && (byte & 64) === 0) ||
          (value === -1 && (byte & 64) !== 0)
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
          return { result: result, nextIndex: index + offset };
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
        return {
          result: new TextDecoder().decode(textBinary),
          nextIndex: nextIndex,
        };
      }
      return {
        result: new a.TextDecoder().decode(textBinary),
        nextIndex: nextIndex,
      };
    },
  },
};

/**
 * Bool. 真か偽. JavaScriptのbooleanで扱う
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
 * バイナリ. JavaScriptのUint8Arrayで扱う
 */
export const Binary: {
  /**
   * 最初にバイト数, その次にバイナリそのまま
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
      return {
        result: binary.slice(length.nextIndex, nextIndex),
        nextIndex: nextIndex,
      };
    },
  },
};

/**
 * リスト. JavaScriptのArrayで扱う
 */
export const List: {
  readonly codec: <element>(a: Codec<element>) => Codec<ReadonlyArray<element>>;
} = {
  codec: <element>(
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
      index = lengthResult.nextIndex;
      const result: Array<element> = [];
      for (let i = 0; i < lengthResult.result; i += 1) {
        const resultAndNextIndex: {
          readonly result: element;
          readonly nextIndex: number;
        } = elementCodec.decode(index, binary);
        result.push(resultAndNextIndex.result);
        index = resultAndNextIndex.nextIndex;
      }
      return { result: result, nextIndex: index };
    },
  }),
};

/**
 * Id
 */
export const Id: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
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
 * Token
 */
export const Token: {
  /**
   * バイナリに変換する
   */
  readonly codec: Codec<string>;
} = {
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
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
export const Maybe: {
  /**
   * 値があるということ
   */
  readonly Just: <value>(a: value) => Maybe<value>;
  /**
   * 値がないということ
   */
  readonly Nothing: <value>() => Maybe<value>;
  readonly codec: <value>(a: Codec<value>) => Codec<Maybe<value>>;
} = {
  Just: <value>(value: value): Maybe<value> => ({ _: "Just", value: value }),
  Nothing: <value>(): Maybe<value> => ({ _: "Nothing" }),
  codec: <value>(valueCodec: Codec<value>): Codec<Maybe<value>> => ({
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
  readonly Ok: <ok, error>(a: ok) => Result<ok, error>;
  /**
   * 失敗
   */
  readonly Error: <ok, error>(a: error) => Result<ok, error>;
  readonly codec: <ok, error>(
    a: Codec<ok>,
    b: Codec<error>
  ) => Codec<Result<ok, error>>;
} = {
  Ok: <ok, error>(ok: ok): Result<ok, error> => ({ _: "Ok", ok: ok }),
  Error: <ok, error>(error: error): Result<ok, error> => ({
    _: "Error",
    error: error,
  }),
  codec: <ok, error>(
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
   * 32bit 符号付き整数. (-2 147 483 648 ～ 2147483647). JavaScriptのnumberとして扱える
   */
  readonly Int32: Type;
  /**
   * 文字列. JavaScriptのStringとして扱える
   */
  readonly String: Type;
  /**
   * 真偽値. JavaScriptのbooleanとして扱える
   */
  readonly Bool: Type;
  /**
   * バイナリ. JavaScriptのUint8Arrayとして扱える
   */
  readonly Binary: Type;
  /**
   * リスト. JavaScriptのArrayとして扱える
   */
  readonly List: (a: Type) => Type;
  /**
   * Maybe. 指定した型の値があるJustと値がないNothingのどちらか
   */
  readonly Maybe: (a: Type) => Type;
  /**
   * Result. 成功と失敗を表す
   */
  readonly Result: (a: OkAndErrorType) => Type;
  /**
   * データを識別するためのもの. `UserId`などの型名を指定する. 16byte. 16進数文字列で32文字
   */
  readonly Id: (a: string) => Type;
  /**
   * データを識別,証明するため. `AccessToken`などの型名を指定する. 32byte. 16進数文字列で64文字
   */
  readonly Token: (a: string) => Type;
  /**
   * 用意されていないアプリ特有の型
   */
  readonly Custom: (a: NameAndTypeParameterList) => Type;
  /**
   * カスタム型の定義で使う型変数
   */
  readonly Parameter: (a: string) => Type;
  readonly codec: Codec<Type>;
} = {
  Int32: { _: "Int32" },
  String: { _: "String" },
  Bool: { _: "Bool" },
  Binary: { _: "Binary" },
  List: (type_: Type): Type => ({ _: "List", type_: type_ }),
  Maybe: (type_: Type): Type => ({ _: "Maybe", type_: type_ }),
  Result: (okAndErrorType: OkAndErrorType): Type => ({
    _: "Result",
    okAndErrorType: okAndErrorType,
  }),
  Id: (string_: string): Type => ({ _: "Id", string_: string_ }),
  Token: (string_: string): Type => ({ _: "Token", string_: string_ }),
  Custom: (nameAndTypeParameterList: NameAndTypeParameterList): Type => ({
    _: "Custom",
    nameAndTypeParameterList: nameAndTypeParameterList,
  }),
  Parameter: (string_: string): Type => ({ _: "Parameter", string_: string_ }),
  codec: {
    encode: (value: Type): ReadonlyArray<number> => {
      switch (value._) {
        case "Int32": {
          return [0];
        }
        case "String": {
          return [1];
        }
        case "Bool": {
          return [2];
        }
        case "Binary": {
          return [3];
        }
        case "List": {
          return [4].concat(Type.codec.encode(value.type_));
        }
        case "Maybe": {
          return [5].concat(Type.codec.encode(value.type_));
        }
        case "Result": {
          return [6].concat(OkAndErrorType.codec.encode(value.okAndErrorType));
        }
        case "Id": {
          return [7].concat(String.codec.encode(value.string_));
        }
        case "Token": {
          return [8].concat(String.codec.encode(value.string_));
        }
        case "Custom": {
          return [9].concat(
            NameAndTypeParameterList.codec.encode(
              value.nameAndTypeParameterList
            )
          );
        }
        case "Parameter": {
          return [10].concat(String.codec.encode(value.string_));
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
        return { result: Type.Int32, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 1) {
        return { result: Type.String, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 2) {
        return { result: Type.Bool, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 3) {
        return { result: Type.Binary, nextIndex: patternIndex.nextIndex };
      }
      if (patternIndex.result === 4) {
        const result: {
          readonly result: Type;
          readonly nextIndex: number;
        } = Type.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.List(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 5) {
        const result: {
          readonly result: Type;
          readonly nextIndex: number;
        } = Type.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Maybe(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 6) {
        const result: {
          readonly result: OkAndErrorType;
          readonly nextIndex: number;
        } = OkAndErrorType.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Result(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 7) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return { result: Type.Id(result.result), nextIndex: result.nextIndex };
      }
      if (patternIndex.result === 8) {
        const result: {
          readonly result: string;
          readonly nextIndex: number;
        } = String.codec.decode(patternIndex.nextIndex, binary);
        return {
          result: Type.Token(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 9) {
        const result: {
          readonly result: NameAndTypeParameterList;
          readonly nextIndex: number;
        } = NameAndTypeParameterList.codec.decode(
          patternIndex.nextIndex,
          binary
        );
        return {
          result: Type.Custom(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 10) {
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
export const OkAndErrorType: { readonly codec: Codec<OkAndErrorType> } = {
  codec: {
    encode: (value: OkAndErrorType): ReadonlyArray<number> =>
      Type.codec.encode(value.ok).concat(Type.codec.encode(value.error)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: OkAndErrorType; readonly nextIndex: number } => {
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
 * カスタム型の指定
 */
export const NameAndTypeParameterList: {
  readonly codec: Codec<NameAndTypeParameterList>;
} = {
  codec: {
    encode: (value: NameAndTypeParameterList): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(List.codec(Type.codec).encode(value.parameterList)),
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: NameAndTypeParameterList;
      readonly nextIndex: number;
    } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const parameterListAndNextIndex: {
        readonly result: ReadonlyArray<Type>;
        readonly nextIndex: number;
      } = List.codec(Type.codec).decode(nameAndNextIndex.nextIndex, binary);
      return {
        result: {
          name: nameAndNextIndex.result,
          parameterList: parameterListAndNextIndex.result,
        },
        nextIndex: parameterListAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * カスタム型の定義
 */
export const CustomTypeDefinition: {
  readonly codec: Codec<CustomTypeDefinition>;
} = {
  codec: {
    encode: (value: CustomTypeDefinition): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(String.codec.encode(value.description))
        .concat(List.codec(String.codec).encode(value.typeParameterList))
        .concat(CustomTypeDefinitionBody.codec.encode(value.body)),
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: CustomTypeDefinition;
      readonly nextIndex: number;
    } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const descriptionAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(nameAndNextIndex.nextIndex, binary);
      const typeParameterListAndNextIndex: {
        readonly result: ReadonlyArray<string>;
        readonly nextIndex: number;
      } = List.codec(String.codec).decode(
        descriptionAndNextIndex.nextIndex,
        binary
      );
      const bodyAndNextIndex: {
        readonly result: CustomTypeDefinitionBody;
        readonly nextIndex: number;
      } = CustomTypeDefinitionBody.codec.decode(
        typeParameterListAndNextIndex.nextIndex,
        binary
      );
      return {
        result: {
          name: nameAndNextIndex.result,
          description: descriptionAndNextIndex.result,
          typeParameterList: typeParameterListAndNextIndex.result,
          body: bodyAndNextIndex.result,
        },
        nextIndex: bodyAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * カスタム型の定義の本体
 */
export const CustomTypeDefinitionBody: {
  /**
   * 直積型. AとBとC
   */
  readonly Product: (a: ReadonlyArray<Member>) => CustomTypeDefinitionBody;
  /**
   * 直和型. AかBかC
   */
  readonly Sum: (a: ReadonlyArray<Pattern>) => CustomTypeDefinitionBody;
  readonly codec: Codec<CustomTypeDefinitionBody>;
} = {
  Product: (memberList: ReadonlyArray<Member>): CustomTypeDefinitionBody => ({
    _: "Product",
    memberList: memberList,
  }),
  Sum: (patternList: ReadonlyArray<Pattern>): CustomTypeDefinitionBody => ({
    _: "Sum",
    patternList: patternList,
  }),
  codec: {
    encode: (value: CustomTypeDefinitionBody): ReadonlyArray<number> => {
      switch (value._) {
        case "Product": {
          return [0].concat(List.codec(Member.codec).encode(value.memberList));
        }
        case "Sum": {
          return [1].concat(
            List.codec(Pattern.codec).encode(value.patternList)
          );
        }
      }
    },
    decode: (
      index: number,
      binary: Uint8Array
    ): {
      readonly result: CustomTypeDefinitionBody;
      readonly nextIndex: number;
    } => {
      const patternIndex: {
        readonly result: number;
        readonly nextIndex: number;
      } = Int32.codec.decode(index, binary);
      if (patternIndex.result === 0) {
        const result: {
          readonly result: ReadonlyArray<Member>;
          readonly nextIndex: number;
        } = List.codec(Member.codec).decode(patternIndex.nextIndex, binary);
        return {
          result: CustomTypeDefinitionBody.Product(result.result),
          nextIndex: result.nextIndex,
        };
      }
      if (patternIndex.result === 1) {
        const result: {
          readonly result: ReadonlyArray<Pattern>;
          readonly nextIndex: number;
        } = List.codec(Pattern.codec).decode(patternIndex.nextIndex, binary);
        return {
          result: CustomTypeDefinitionBody.Sum(result.result),
          nextIndex: result.nextIndex,
        };
      }
      throw new Error("存在しないパターンを指定された 型を更新してください");
    },
  },
};

/**
 * 直積型の構成要素. 名前と型を持つ
 */
export const Member: { readonly codec: Codec<Member> } = {
  codec: {
    encode: (value: Member): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(String.codec.encode(value.description))
        .concat(Type.codec.encode(value["type"])),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Member; readonly nextIndex: number } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const descriptionAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(nameAndNextIndex.nextIndex, binary);
      const typeAndNextIndex: {
        readonly result: Type;
        readonly nextIndex: number;
      } = Type.codec.decode(descriptionAndNextIndex.nextIndex, binary);
      return {
        result: {
          name: nameAndNextIndex.result,
          description: descriptionAndNextIndex.result,
          type: typeAndNextIndex.result,
        },
        nextIndex: typeAndNextIndex.nextIndex,
      };
    },
  },
};

/**
 * 直和型の構成要素. タグと,パラメーターの型がついている
 */
export const Pattern: { readonly codec: Codec<Pattern> } = {
  codec: {
    encode: (value: Pattern): ReadonlyArray<number> =>
      String.codec
        .encode(value.name)
        .concat(String.codec.encode(value.description))
        .concat(Maybe.codec(Type.codec).encode(value.parameter)),
    decode: (
      index: number,
      binary: Uint8Array
    ): { readonly result: Pattern; readonly nextIndex: number } => {
      const nameAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(index, binary);
      const descriptionAndNextIndex: {
        readonly result: string;
        readonly nextIndex: number;
      } = String.codec.decode(nameAndNextIndex.nextIndex, binary);
      const parameterAndNextIndex: {
        readonly result: Maybe<Type>;
        readonly nextIndex: number;
      } = Maybe.codec(Type.codec).decode(
        descriptionAndNextIndex.nextIndex,
        binary
      );
      return {
        result: {
          name: nameAndNextIndex.result,
          description: descriptionAndNextIndex.result,
          parameter: parameterAndNextIndex.result,
        },
        nextIndex: parameterAndNextIndex.nextIndex,
      };
    },
  },
};