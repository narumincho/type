"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextIndex = exports.getResult = exports.decodeLambda = exports.returnStatement = exports.decodeReturnType = exports.decodeFunctionType = exports.encodeLambda = exports.encodeFunctionType = exports.codecTypeDefinition = exports.codecType = exports.codecTypeWithTypeParameter = void 0;
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.codecTypeWithTypeParameter = (type_, typeParameterList, withKernel) => {
    return typeParameterList.length === 0
        ? exports.codecType(type_, withKernel)
        : js_ts_code_generator_1.data.typeFunction(typeParameterList.map(js_ts_code_generator_1.identifer.fromString), typeParameterList.map((typeParameter) => exports.codecType(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)), withKernel)), exports.codecType(js_ts_code_generator_1.data.typeWithParameter(type_, typeParameterList.map((typeParameter) => js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)))), withKernel));
};
const codecName = js_ts_code_generator_1.identifer.fromString("Codec");
/** `@narumincho/type`の型`Codec<type_>`か `Codec<type_>` を表す */
exports.codecType = (type_, withKernel) => js_ts_code_generator_1.data.typeWithParameter(withKernel
    ? js_ts_code_generator_1.data.typeScopeInFile(codecName)
    : js_ts_code_generator_1.data.typeImported(util.moduleName, codecName), [type_]);
exports.codecTypeDefinition = () => {
    const typeParameterIdentifer = js_ts_code_generator_1.identifer.fromString("T");
    return {
        name: codecName,
        document: "バイナリと相互変換するための関数",
        parameterList: [typeParameterIdentifer],
        type_: js_ts_code_generator_1.data.typeObject(new Map([
            [
                util.encodePropertyName,
                {
                    type_: exports.encodeFunctionType(js_ts_code_generator_1.data.typeScopeInFile(typeParameterIdentifer)),
                    document: "",
                },
            ],
            [
                util.decodePropertyName,
                {
                    type_: exports.decodeFunctionType(js_ts_code_generator_1.data.typeScopeInFile(typeParameterIdentifer)),
                    document: "",
                },
            ],
        ])),
    };
};
/**
 * ```ts
 * (a: type_) => Readonly<number>
 * ```
 */
exports.encodeFunctionType = (type_) => js_ts_code_generator_1.data.typeFunction([], [type_], encodeReturnType);
exports.encodeLambda = (type_, statementList) => {
    const valueName = js_ts_code_generator_1.identifer.fromString("value");
    return js_ts_code_generator_1.data.lambda([
        {
            name: valueName,
            type_,
        },
    ], [], encodeReturnType, statementList(js_ts_code_generator_1.data.variable(valueName)));
};
const encodeReturnType = js_ts_code_generator_1.data.readonlyArrayType(js_ts_code_generator_1.data.typeNumber);
/**
 * ```ts
 * (a: number, b: Uint8Array) => { readonly result: type_, readonly nextIndex: number }
 * ```
 */
exports.decodeFunctionType = (type_) => js_ts_code_generator_1.data.typeFunction([], decodeParameterList.map((parameter) => parameter.type_), exports.decodeReturnType(type_));
exports.decodeReturnType = (type_) => js_ts_code_generator_1.data.typeObject(new Map([
    [
        util.resultProperty,
        {
            type_,
            document: "",
        },
    ],
    [util.nextIndexProperty, { type_: js_ts_code_generator_1.data.typeNumber, document: "" }],
]));
const indexIdentifer = js_ts_code_generator_1.identifer.fromString("index");
const binaryIdentifer = js_ts_code_generator_1.identifer.fromString("binary");
/**
 * ( index: number, binary: Uint8Array )
 */
const decodeParameterList = [
    {
        name: indexIdentifer,
        type_: js_ts_code_generator_1.data.typeNumber,
        document: "バイナリを読み込み開始位置",
    },
    {
        name: binaryIdentifer,
        type_: js_ts_code_generator_1.data.uint8ArrayType,
        document: "バイナリ",
    },
];
/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
exports.returnStatement = (resultExpr, nextIndexExpr) => js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.objectLiteral([
    js_ts_code_generator_1.data.memberKeyValue(util.resultProperty, resultExpr),
    js_ts_code_generator_1.data.memberKeyValue(util.nextIndexProperty, nextIndexExpr),
]));
exports.decodeLambda = (type, statementList) => {
    return js_ts_code_generator_1.data.lambda(decodeParameterList, [], exports.decodeReturnType(type), statementList(js_ts_code_generator_1.data.variable(indexIdentifer), js_ts_code_generator_1.data.variable(binaryIdentifer)));
};
/**
 * ```ts
 * expr.result
 * ```
 */
exports.getResult = (resultAndNextIndexExpr) => js_ts_code_generator_1.data.get(resultAndNextIndexExpr, util.resultProperty);
/**
 * ```ts
 * expr.nextIndex
 * ```
 */
exports.getNextIndex = (resultAndNextIndexExpr) => js_ts_code_generator_1.data.get(resultAndNextIndexExpr, util.nextIndexProperty);
