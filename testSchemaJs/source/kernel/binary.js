"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableDefinition = exports.codec = exports.type = exports.name = void 0;
const c = require("./codec");
const int32 = require("./int32");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.name = js_ts_code_generator_1.identifer.fromString("Binary");
exports.type = js_ts_code_generator_1.data.uint8ArrayType;
exports.codec = (withKernel) => js_ts_code_generator_1.data.get(withKernel ? js_ts_code_generator_1.data.variable(exports.name) : js_ts_code_generator_1.data.importedVariable(util.moduleName, exports.name), util.codecPropertyName);
exports.variableDefinition = () => ({
    name: exports.name,
    document: "バイナリ. JavaScriptのUint8Arrayで扱う",
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: c.codecType(exports.type, true),
                document: "最初にバイト数, その次にバイナリそのまま",
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
    js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.callMethod(int32.encode(true, js_ts_code_generator_1.data.get(valueVar, "length")), "concat", [
        js_ts_code_generator_1.data.arrayLiteral([{ expr: valueVar, spread: true }]),
    ])),
]);
const decodeDefinition = () => {
    const lengthName = js_ts_code_generator_1.identifer.fromString("length");
    const lengthVar = js_ts_code_generator_1.data.variable(lengthName);
    const nextIndexName = js_ts_code_generator_1.identifer.fromString("nextIndex");
    const nextIndexVar = js_ts_code_generator_1.data.variable(nextIndexName);
    return c.decodeLambda(exports.type, (parameterIndex, parameterBinary) => [
        js_ts_code_generator_1.data.statementVariableDefinition(lengthName, c.decodeReturnType(js_ts_code_generator_1.data.typeNumber), int32.decode(true, parameterIndex, parameterBinary)),
        js_ts_code_generator_1.data.statementVariableDefinition(nextIndexName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar))),
        c.returnStatement(js_ts_code_generator_1.data.callMethod(parameterBinary, "slice", [
            c.getNextIndex(lengthVar),
            nextIndexVar,
        ]), nextIndexVar),
    ]);
};
