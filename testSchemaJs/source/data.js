"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pattern = exports.Member = exports.CustomTypeDefinitionBody = exports.CustomTypeDefinition = exports.NameAndTypeParameterList = exports.OkAndErrorType = exports.Type = exports.Result = exports.Maybe = exports.Token = exports.Id = exports.List = exports.Binary = exports.Bool = exports.String = exports.Int32 = void 0;
const a = require("util");
/**
 * -2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う
 */
exports.Int32 = {
    codec: {
        encode: (value) => {
            let rest = value | 0;
            const result = [];
            while (true) {
                const byte = rest & 127;
                rest >>= 7;
                if ((rest === 0 && (byte & 64) === 0) ||
                    (rest === -1 && (byte & 64) !== 0)) {
                    result.push(byte);
                    return result;
                }
                result.push(byte | 128);
            }
        },
        decode: (index, binary) => {
            let result = 0;
            let offset = 0;
            while (true) {
                const byte = binary[index + offset];
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
exports.String = {
    codec: {
        encode: (value) => {
            const result = [
                ...new (process === undefined || process.title === "browser"
                    ? TextEncoder
                    : a.TextEncoder)().encode(value),
            ];
            return exports.Int32.codec.encode(result.length).concat(result);
        },
        decode: (index, binary) => {
            const length = exports.Int32.codec.decode(index, binary);
            const nextIndex = length.nextIndex + length.result;
            const textBinary = binary.slice(length.nextIndex, nextIndex);
            const isBrowser = process === undefined || process.title === "browser";
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
exports.Bool = {
    codec: {
        encode: (value) => [value ? 1 : 0],
        decode: (index, binary) => ({
            result: binary[index] !== 0,
            nextIndex: index + 1,
        }),
    },
};
/**
 * バイナリ. JavaScriptのUint8Arrayで扱う
 */
exports.Binary = {
    codec: {
        encode: (value) => exports.Int32.codec.encode(value.length).concat([...value]),
        decode: (index, binary) => {
            const length = exports.Int32.codec.decode(index, binary);
            const nextIndex = length.nextIndex + length.result;
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
exports.List = {
    codec: (elementCodec) => ({
        encode: (value) => {
            let result = exports.Int32.codec.encode(value.length);
            for (const element of value) {
                result = result.concat(elementCodec.encode(element));
            }
            return result;
        },
        decode: (index, binary) => {
            const lengthResult = exports.Int32.codec.decode(index, binary);
            let nextIndex = lengthResult.nextIndex;
            const result = [];
            for (let i = 0; i < lengthResult.result; i += 1) {
                const resultAndNextIndex = elementCodec.decode(nextIndex, binary);
                result.push(resultAndNextIndex.result);
                nextIndex = resultAndNextIndex.nextIndex;
            }
            return { result: result, nextIndex: index };
        },
    }),
};
/**
 * Id
 */
exports.Id = {
    codec: {
        encode: (value) => {
            const result = [];
            for (let i = 0; i < 16; i += 1) {
                result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
            }
            return result;
        },
        decode: (index, binary) => ({
            result: [...binary.slice(index, index + 16)]
                .map((n) => n.toString(16).padStart(2, "0"))
                .join(""),
            nextIndex: index + 16,
        }),
    },
};
/**
 * Token
 */
exports.Token = {
    codec: {
        encode: (value) => {
            const result = [];
            for (let i = 0; i < 32; i += 1) {
                result[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
            }
            return result;
        },
        decode: (index, binary) => ({
            result: [...binary.slice(index, index + 32)]
                .map((n) => n.toString(16).padStart(2, "0"))
                .join(""),
            nextIndex: index + 32,
        }),
    },
};
/**
 * Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
exports.Maybe = {
    Just: (value) => ({ _: "Just", value: value }),
    Nothing: () => ({ _: "Nothing" }),
    codec: (valueCodec) => ({
        encode: (value) => {
            switch (value._) {
                case "Just": {
                    return [0].concat(valueCodec.encode(value.value));
                }
                case "Nothing": {
                    return [1];
                }
            }
        },
        decode: (index, binary) => {
            const patternIndex = exports.Int32.codec.decode(index, binary);
            if (patternIndex.result === 0) {
                const result = valueCodec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Maybe.Just(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 1) {
                return { result: exports.Maybe.Nothing(), nextIndex: patternIndex.nextIndex };
            }
            throw new Error("存在しないパターンを指定された 型を更新してください");
        },
    }),
};
/**
 * 成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した
 */
exports.Result = {
    Ok: (ok) => ({ _: "Ok", ok: ok }),
    Error: (error) => ({
        _: "Error",
        error: error,
    }),
    codec: (okCodec, errorCodec) => ({
        encode: (value) => {
            switch (value._) {
                case "Ok": {
                    return [0].concat(okCodec.encode(value.ok));
                }
                case "Error": {
                    return [1].concat(errorCodec.encode(value.error));
                }
            }
        },
        decode: (index, binary) => {
            const patternIndex = exports.Int32.codec.decode(index, binary);
            if (patternIndex.result === 0) {
                const result = okCodec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Result.Ok(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 1) {
                const result = errorCodec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Result.Error(result.result),
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
exports.Type = {
    Int32: { _: "Int32" },
    String: { _: "String" },
    Bool: { _: "Bool" },
    Binary: { _: "Binary" },
    List: (type_) => ({ _: "List", type_: type_ }),
    Maybe: (type_) => ({ _: "Maybe", type_: type_ }),
    Result: (okAndErrorType) => ({
        _: "Result",
        okAndErrorType: okAndErrorType,
    }),
    Id: (string_) => ({ _: "Id", string_: string_ }),
    Token: (string_) => ({ _: "Token", string_: string_ }),
    Custom: (nameAndTypeParameterList) => ({
        _: "Custom",
        nameAndTypeParameterList: nameAndTypeParameterList,
    }),
    Parameter: (string_) => ({ _: "Parameter", string_: string_ }),
    codec: {
        encode: (value) => {
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
                    return [4].concat(exports.Type.codec.encode(value.type_));
                }
                case "Maybe": {
                    return [5].concat(exports.Type.codec.encode(value.type_));
                }
                case "Result": {
                    return [6].concat(exports.OkAndErrorType.codec.encode(value.okAndErrorType));
                }
                case "Id": {
                    return [7].concat(exports.String.codec.encode(value.string_));
                }
                case "Token": {
                    return [8].concat(exports.String.codec.encode(value.string_));
                }
                case "Custom": {
                    return [9].concat(exports.NameAndTypeParameterList.codec.encode(value.nameAndTypeParameterList));
                }
                case "Parameter": {
                    return [10].concat(exports.String.codec.encode(value.string_));
                }
            }
        },
        decode: (index, binary) => {
            const patternIndex = exports.Int32.codec.decode(index, binary);
            if (patternIndex.result === 0) {
                return { result: exports.Type.Int32, nextIndex: patternIndex.nextIndex };
            }
            if (patternIndex.result === 1) {
                return { result: exports.Type.String, nextIndex: patternIndex.nextIndex };
            }
            if (patternIndex.result === 2) {
                return { result: exports.Type.Bool, nextIndex: patternIndex.nextIndex };
            }
            if (patternIndex.result === 3) {
                return { result: exports.Type.Binary, nextIndex: patternIndex.nextIndex };
            }
            if (patternIndex.result === 4) {
                const result = exports.Type.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.List(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 5) {
                const result = exports.Type.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.Maybe(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 6) {
                const result = exports.OkAndErrorType.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.Result(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 7) {
                const result = exports.String.codec.decode(patternIndex.nextIndex, binary);
                return { result: exports.Type.Id(result.result), nextIndex: result.nextIndex };
            }
            if (patternIndex.result === 8) {
                const result = exports.String.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.Token(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 9) {
                const result = exports.NameAndTypeParameterList.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.Custom(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 10) {
                const result = exports.String.codec.decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.Type.Parameter(result.result),
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
exports.OkAndErrorType = {
    codec: {
        encode: (value) => exports.Type.codec.encode(value.ok).concat(exports.Type.codec.encode(value.error)),
        decode: (index, binary) => {
            const okAndNextIndex = exports.Type.codec.decode(index, binary);
            const errorAndNextIndex = exports.Type.codec.decode(okAndNextIndex.nextIndex, binary);
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
exports.NameAndTypeParameterList = {
    codec: {
        encode: (value) => exports.String.codec
            .encode(value.name)
            .concat(exports.List.codec(exports.Type.codec).encode(value.parameterList)),
        decode: (index, binary) => {
            const nameAndNextIndex = exports.String.codec.decode(index, binary);
            const parameterListAndNextIndex = exports.List.codec(exports.Type.codec).decode(nameAndNextIndex.nextIndex, binary);
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
exports.CustomTypeDefinition = {
    codec: {
        encode: (value) => exports.String.codec
            .encode(value.name)
            .concat(exports.String.codec.encode(value.description))
            .concat(exports.List.codec(exports.String.codec).encode(value.typeParameterList))
            .concat(exports.CustomTypeDefinitionBody.codec.encode(value.body)),
        decode: (index, binary) => {
            const nameAndNextIndex = exports.String.codec.decode(index, binary);
            const descriptionAndNextIndex = exports.String.codec.decode(nameAndNextIndex.nextIndex, binary);
            const typeParameterListAndNextIndex = exports.List.codec(exports.String.codec).decode(descriptionAndNextIndex.nextIndex, binary);
            const bodyAndNextIndex = exports.CustomTypeDefinitionBody.codec.decode(typeParameterListAndNextIndex.nextIndex, binary);
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
exports.CustomTypeDefinitionBody = {
    Product: (memberList) => ({
        _: "Product",
        memberList: memberList,
    }),
    Sum: (patternList) => ({
        _: "Sum",
        patternList: patternList,
    }),
    codec: {
        encode: (value) => {
            switch (value._) {
                case "Product": {
                    return [0].concat(exports.List.codec(exports.Member.codec).encode(value.memberList));
                }
                case "Sum": {
                    return [1].concat(exports.List.codec(exports.Pattern.codec).encode(value.patternList));
                }
            }
        },
        decode: (index, binary) => {
            const patternIndex = exports.Int32.codec.decode(index, binary);
            if (patternIndex.result === 0) {
                const result = exports.List.codec(exports.Member.codec).decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.CustomTypeDefinitionBody.Product(result.result),
                    nextIndex: result.nextIndex,
                };
            }
            if (patternIndex.result === 1) {
                const result = exports.List.codec(exports.Pattern.codec).decode(patternIndex.nextIndex, binary);
                return {
                    result: exports.CustomTypeDefinitionBody.Sum(result.result),
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
exports.Member = {
    codec: {
        encode: (value) => exports.String.codec
            .encode(value.name)
            .concat(exports.String.codec.encode(value.description))
            .concat(exports.Type.codec.encode(value["type"])),
        decode: (index, binary) => {
            const nameAndNextIndex = exports.String.codec.decode(index, binary);
            const descriptionAndNextIndex = exports.String.codec.decode(nameAndNextIndex.nextIndex, binary);
            const typeAndNextIndex = exports.Type.codec.decode(descriptionAndNextIndex.nextIndex, binary);
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
exports.Pattern = {
    codec: {
        encode: (value) => exports.String.codec
            .encode(value.name)
            .concat(exports.String.codec.encode(value.description))
            .concat(exports.Maybe.codec(exports.Type.codec).encode(value.parameter)),
        decode: (index, binary) => {
            const nameAndNextIndex = exports.String.codec.decode(index, binary);
            const descriptionAndNextIndex = exports.String.codec.decode(nameAndNextIndex.nextIndex, binary);
            const parameterAndNextIndex = exports.Maybe.codec(exports.Type.codec).decode(descriptionAndNextIndex.nextIndex, binary);
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
