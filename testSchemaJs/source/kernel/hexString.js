"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenVariableDefinition = exports.idVariableDefinition = exports.typeDefinition = exports.tokenKernelExprDefinition = exports.idKernelExprDefinition = void 0;
const codec = require("./codec");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
const type = js_ts_code_generator_1.data.typeString;
const hexEncodeDefinition = (byteSize) => {
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const resultVar = js_ts_code_generator_1.data.variable(resultName);
    const iName = js_ts_code_generator_1.identifer.fromString("i");
    const iVar = js_ts_code_generator_1.data.variable(iName);
    return codec.encodeLambda(type, (value) => [
        js_ts_code_generator_1.data.statementVariableDefinition(resultName, js_ts_code_generator_1.data.arrayType(js_ts_code_generator_1.data.typeNumber), js_ts_code_generator_1.data.arrayLiteral([])),
        js_ts_code_generator_1.data.statementFor(iName, js_ts_code_generator_1.data.numberLiteral(byteSize), [
            js_ts_code_generator_1.data.statementSet(js_ts_code_generator_1.data.getByExpr(resultVar, iVar), null, js_ts_code_generator_1.data.callNumberMethod("parseInt", [
                js_ts_code_generator_1.data.callMethod(value, "slice", [
                    js_ts_code_generator_1.data.multiplication(iVar, js_ts_code_generator_1.data.numberLiteral(2)),
                    js_ts_code_generator_1.data.addition(js_ts_code_generator_1.data.multiplication(iVar, js_ts_code_generator_1.data.numberLiteral(2)), js_ts_code_generator_1.data.numberLiteral(2)),
                ]),
                js_ts_code_generator_1.data.numberLiteral(16),
            ])),
        ]),
        js_ts_code_generator_1.data.statementReturn(resultVar),
    ]);
};
const decodeDefinition = (byteSize) => {
    return codec.decodeLambda(type, (parameterIndex, parameterBinary) => [
        codec.returnStatement(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.arrayLiteral([
            {
                expr: js_ts_code_generator_1.data.callMethod(parameterBinary, "slice", [
                    parameterIndex,
                    js_ts_code_generator_1.data.addition(parameterIndex, js_ts_code_generator_1.data.numberLiteral(byteSize)),
                ]),
                spread: true,
            },
        ]), "map", [
            js_ts_code_generator_1.data.lambda([
                {
                    name: js_ts_code_generator_1.identifer.fromString("n"),
                    type_: js_ts_code_generator_1.data.typeNumber,
                },
            ], [], js_ts_code_generator_1.data.typeString, [
                js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("n")), "toString", [js_ts_code_generator_1.data.numberLiteral(16)]), "padStart", [js_ts_code_generator_1.data.numberLiteral(2), js_ts_code_generator_1.data.stringLiteral("0")])),
            ]),
        ]), "join", [js_ts_code_generator_1.data.stringLiteral("")]), js_ts_code_generator_1.data.addition(parameterIndex, js_ts_code_generator_1.data.numberLiteral(byteSize))),
    ]);
};
const variableDefinition = (byteSize, name) => ({
    name,
    document: name,
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: codec.codecType(type, true),
                document: "バイナリに変換する",
            },
        ],
    ])),
    expr: js_ts_code_generator_1.data.objectLiteral([
        js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.objectLiteral([
            js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, hexEncodeDefinition(byteSize)),
            js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, decodeDefinition(byteSize)),
        ])),
    ]),
});
const idName = js_ts_code_generator_1.identifer.fromString("Id");
const tokenName = js_ts_code_generator_1.identifer.fromString("Token");
exports.idKernelExprDefinition = variableDefinition(16, idName);
exports.tokenKernelExprDefinition = variableDefinition(32, tokenName);
exports.typeDefinition = (name) => ({
    name: js_ts_code_generator_1.identifer.fromString(name),
    document: "",
    parameterList: [],
    type_: js_ts_code_generator_1.data.typeIntersection(js_ts_code_generator_1.data.typeString, js_ts_code_generator_1.data.typeObject(new Map([
        [
            "_" + util.firstLowerCase(name),
            { type_: js_ts_code_generator_1.data.typeNever, document: "" },
        ],
    ]))),
});
exports.idVariableDefinition = (name, withKernel) => {
    const targetType = js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(name));
    const idCodec = js_ts_code_generator_1.data.get(withKernel
        ? js_ts_code_generator_1.data.variable(idName)
        : js_ts_code_generator_1.data.importedVariable(util.moduleName, idName), util.codecPropertyName);
    return {
        name: js_ts_code_generator_1.identifer.fromString(name),
        document: name,
        type_: js_ts_code_generator_1.data.typeObject(new Map([
            [
                util.codecPropertyName,
                {
                    type_: codec.codecType(targetType, true),
                    document: "バイナリに変換する",
                },
            ],
        ])),
        expr: js_ts_code_generator_1.data.objectLiteral([
            js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.objectLiteral([
                js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, js_ts_code_generator_1.data.get(idCodec, util.encodePropertyName)),
                js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, js_ts_code_generator_1.data.typeAssertion(js_ts_code_generator_1.data.get(idCodec, util.decodePropertyName), codec.decodeFunctionType(targetType))),
            ])),
        ]),
    };
};
exports.tokenVariableDefinition = (name, withKernel) => {
    const targetType = js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(name));
    const tokenCodec = js_ts_code_generator_1.data.get(withKernel
        ? js_ts_code_generator_1.data.variable(tokenName)
        : js_ts_code_generator_1.data.importedVariable(util.moduleName, tokenName), util.codecPropertyName);
    return {
        name: js_ts_code_generator_1.identifer.fromString(name),
        document: name,
        type_: js_ts_code_generator_1.data.typeObject(new Map([
            [
                util.codecPropertyName,
                {
                    type_: codec.codecType(targetType, true),
                    document: "バイナリに変換する",
                },
            ],
        ])),
        expr: js_ts_code_generator_1.data.objectLiteral([
            js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.objectLiteral([
                js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, js_ts_code_generator_1.data.get(tokenCodec, util.encodePropertyName)),
                js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, js_ts_code_generator_1.data.typeAssertion(js_ts_code_generator_1.data.get(tokenCodec, util.decodePropertyName), codec.decodeFunctionType(targetType))),
            ])),
        ]),
    };
};
