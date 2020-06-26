"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeDefinition = exports.variableDefinition = exports.decode = exports.encode = exports.codec = void 0;
const c = require("./codec");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
const name = js_ts_code_generator_1.identifer.fromString("Int32");
const type = js_ts_code_generator_1.data.typeNumber;
exports.codec = (withKernel) => js_ts_code_generator_1.data.get(withKernel ? js_ts_code_generator_1.data.variable(name) : js_ts_code_generator_1.data.importedVariable(util.moduleName, name), util.codecPropertyName);
exports.encode = (withKernel, target) => js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(exports.codec(withKernel), util.encodePropertyName), [target]);
exports.decode = (withKernel, index, binary) => js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(exports.codec(withKernel), util.decodePropertyName), [index, binary]);
exports.variableDefinition = () => ({
    name,
    document: "-2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う",
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: c.codecType(js_ts_code_generator_1.data.typeNumber, true),
                document: "numberの32bit符号あり整数をSigned Leb128のバイナリに変換する",
            },
        ],
    ])),
    expr: js_ts_code_generator_1.data.objectLiteral([
        js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.objectLiteral([
            js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, encodeDefinition()),
            js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, exports.decodeDefinition()),
        ])),
    ]),
});
/**
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換するコード
 */
const encodeDefinition = () => {
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const resultVar = js_ts_code_generator_1.data.variable(resultName);
    const byteName = js_ts_code_generator_1.identifer.fromString("byte");
    const byteVar = js_ts_code_generator_1.data.variable(byteName);
    const restName = js_ts_code_generator_1.identifer.fromString("rest");
    const restVar = js_ts_code_generator_1.data.variable(restName);
    return c.encodeLambda(type, (valueVar) => [
        js_ts_code_generator_1.data.statementLetVariableDefinition(restName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.bitwiseOr(valueVar, js_ts_code_generator_1.data.numberLiteral(0))),
        js_ts_code_generator_1.data.statementVariableDefinition(resultName, js_ts_code_generator_1.data.arrayType(js_ts_code_generator_1.data.typeNumber), js_ts_code_generator_1.data.arrayLiteral([])),
        js_ts_code_generator_1.data.statementWhileTrue([
            js_ts_code_generator_1.data.statementVariableDefinition(byteName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.bitwiseAnd(restVar, js_ts_code_generator_1.data.numberLiteral(0x7f))),
            js_ts_code_generator_1.data.statementSet(restVar, ">>", js_ts_code_generator_1.data.numberLiteral(7)),
            js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.logicalOr(js_ts_code_generator_1.data.logicalAnd(js_ts_code_generator_1.data.equal(restVar, js_ts_code_generator_1.data.numberLiteral(0)), js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.bitwiseAnd(byteVar, js_ts_code_generator_1.data.numberLiteral(0x40)), js_ts_code_generator_1.data.numberLiteral(0))), js_ts_code_generator_1.data.logicalAnd(js_ts_code_generator_1.data.equal(restVar, js_ts_code_generator_1.data.numberLiteral(-1)), js_ts_code_generator_1.data.notEqual(js_ts_code_generator_1.data.bitwiseAnd(byteVar, js_ts_code_generator_1.data.numberLiteral(0x40)), js_ts_code_generator_1.data.numberLiteral(0)))), [
                js_ts_code_generator_1.data.statementEvaluateExpr(js_ts_code_generator_1.data.callMethod(resultVar, "push", [byteVar])),
                js_ts_code_generator_1.data.statementReturn(resultVar),
            ]),
            js_ts_code_generator_1.data.statementEvaluateExpr(js_ts_code_generator_1.data.callMethod(resultVar, "push", [
                js_ts_code_generator_1.data.bitwiseOr(byteVar, js_ts_code_generator_1.data.numberLiteral(0x80)),
            ])),
        ]),
    ]);
};
exports.decodeDefinition = () => {
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const resultVar = js_ts_code_generator_1.data.variable(resultName);
    const offsetName = js_ts_code_generator_1.identifer.fromString("offset");
    const offsetVar = js_ts_code_generator_1.data.variable(offsetName);
    const byteName = js_ts_code_generator_1.identifer.fromString("byte");
    const byteVar = js_ts_code_generator_1.data.variable(byteName);
    return c.decodeLambda(js_ts_code_generator_1.data.typeNumber, (parameterIndex, parameterBinary) => [
        js_ts_code_generator_1.data.statementLetVariableDefinition(resultName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.numberLiteral(0)),
        js_ts_code_generator_1.data.statementLetVariableDefinition(offsetName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.numberLiteral(0)),
        js_ts_code_generator_1.data.statementWhileTrue([
            js_ts_code_generator_1.data.statementVariableDefinition(byteName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.getByExpr(parameterBinary, js_ts_code_generator_1.data.addition(parameterIndex, offsetVar))),
            js_ts_code_generator_1.data.statementSet(resultVar, "|", js_ts_code_generator_1.data.leftShift(js_ts_code_generator_1.data.bitwiseAnd(byteVar, js_ts_code_generator_1.data.numberLiteral(0x7f)), js_ts_code_generator_1.data.multiplication(offsetVar, js_ts_code_generator_1.data.numberLiteral(7)))),
            js_ts_code_generator_1.data.statementSet(offsetVar, "+", js_ts_code_generator_1.data.numberLiteral(1)),
            js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.bitwiseAnd(js_ts_code_generator_1.data.numberLiteral(0x80), byteVar), js_ts_code_generator_1.data.numberLiteral(0)), [
                js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.logicalAnd(js_ts_code_generator_1.data.lessThan(js_ts_code_generator_1.data.multiplication(offsetVar, js_ts_code_generator_1.data.numberLiteral(7)), js_ts_code_generator_1.data.numberLiteral(32)), js_ts_code_generator_1.data.notEqual(js_ts_code_generator_1.data.bitwiseAnd(byteVar, js_ts_code_generator_1.data.numberLiteral(0x40)), js_ts_code_generator_1.data.numberLiteral(0))), [
                    c.returnStatement(js_ts_code_generator_1.data.bitwiseOr(resultVar, js_ts_code_generator_1.data.leftShift(js_ts_code_generator_1.data.bitwiseNot(js_ts_code_generator_1.data.numberLiteral(0)), js_ts_code_generator_1.data.multiplication(offsetVar, js_ts_code_generator_1.data.numberLiteral(7)))), js_ts_code_generator_1.data.addition(parameterIndex, offsetVar)),
                ]),
                c.returnStatement(resultVar, js_ts_code_generator_1.data.addition(parameterIndex, offsetVar)),
            ]),
        ]),
    ]);
};
