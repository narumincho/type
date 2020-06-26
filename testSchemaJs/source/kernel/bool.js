"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableDefinition = exports.codec = exports.type = void 0;
const c = require("./codec");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
const name = js_ts_code_generator_1.identifer.fromString("Bool");
exports.type = js_ts_code_generator_1.data.typeBoolean;
exports.codec = (withKernel) => js_ts_code_generator_1.data.get(withKernel ? js_ts_code_generator_1.data.variable(name) : js_ts_code_generator_1.data.importedVariable(util.moduleName, name), util.codecPropertyName);
exports.variableDefinition = () => ({
    name,
    document: "Bool. 真か偽. JavaScriptのbooleanで扱う",
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: c.codecType(exports.type, true),
                document: "true: 1, false: 0. (1byte)としてバイナリに変換する",
            },
        ],
    ])),
    expr: js_ts_code_generator_1.data.objectLiteral([
        js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.objectLiteral([
            js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, encodeDefinition()),
            js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, decodeDefinition()),
        ])),
    ]),
});
const encodeDefinition = () => c.encodeLambda(exports.type, (valueVar) => [
    js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.arrayLiteral([
        {
            expr: js_ts_code_generator_1.data.conditionalOperator(valueVar, js_ts_code_generator_1.data.numberLiteral(1), js_ts_code_generator_1.data.numberLiteral(0)),
            spread: false,
        },
    ])),
]);
const decodeDefinition = () => c.decodeLambda(exports.type, (parameterIndex, parameterBinary) => [
    c.returnStatement(js_ts_code_generator_1.data.notEqual(js_ts_code_generator_1.data.getByExpr(parameterBinary, parameterIndex), js_ts_code_generator_1.data.numberLiteral(0)), js_ts_code_generator_1.data.addition(parameterIndex, js_ts_code_generator_1.data.numberLiteral(1))),
]);
