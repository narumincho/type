"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exprDefinition = exports.codec = exports.type = exports.name = void 0;
const c = require("./codec");
const int32 = require("./int32");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.name = js_ts_code_generator_1.identifer.fromString("String");
exports.type = js_ts_code_generator_1.data.typeString;
exports.codec = (withKernel) => js_ts_code_generator_1.data.get(withKernel ? js_ts_code_generator_1.data.variable(exports.name) : js_ts_code_generator_1.data.importedVariable(util.moduleName, exports.name), util.codecPropertyName);
exports.exprDefinition = () => ({
    name: exports.name,
    document: "文字列. JavaScriptのstringで扱う",
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: c.codecType(exports.type, true),
                document: "stringをUTF-8のバイナリに変換する",
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
const encodeDefinition = () => {
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const resultVar = js_ts_code_generator_1.data.variable(resultName);
    return c.encodeLambda(exports.type, (valueVar) => [
        js_ts_code_generator_1.data.statementVariableDefinition(resultName, js_ts_code_generator_1.data.readonlyArrayType(js_ts_code_generator_1.data.typeNumber), js_ts_code_generator_1.data.arrayLiteral([
            {
                expr: js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.newExpr(js_ts_code_generator_1.data.conditionalOperator(js_ts_code_generator_1.data.logicalOr(js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("process")), js_ts_code_generator_1.data.undefinedLiteral), js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("process")), "title"), js_ts_code_generator_1.data.stringLiteral("browser"))), js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("TextEncoder")), js_ts_code_generator_1.data.importedVariable("util", js_ts_code_generator_1.identifer.fromString("TextEncoder"))), []), util.encodePropertyName, [valueVar]),
                spread: true,
            },
        ])),
        js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.callMethod(int32.encode(true, js_ts_code_generator_1.data.get(resultVar, "length")), "concat", [
            resultVar,
        ])),
    ]);
};
const decodeDefinition = () => {
    const lengthName = js_ts_code_generator_1.identifer.fromString("length");
    const lengthVar = js_ts_code_generator_1.data.variable(lengthName);
    const nextIndexName = js_ts_code_generator_1.identifer.fromString("nextIndex");
    const nextIndexVar = js_ts_code_generator_1.data.variable(nextIndexName);
    const textBinaryName = js_ts_code_generator_1.identifer.fromString("textBinary");
    const textBinaryVar = js_ts_code_generator_1.data.variable(textBinaryName);
    const isBrowserName = js_ts_code_generator_1.identifer.fromString("isBrowser");
    return c.decodeLambda(exports.type, (parameterIndex, parameterBinary) => [
        js_ts_code_generator_1.data.statementVariableDefinition(lengthName, c.decodeReturnType(js_ts_code_generator_1.data.typeNumber), int32.decode(true, parameterIndex, parameterBinary)),
        js_ts_code_generator_1.data.statementVariableDefinition(nextIndexName, js_ts_code_generator_1.data.typeNumber, js_ts_code_generator_1.data.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar))),
        js_ts_code_generator_1.data.statementVariableDefinition(textBinaryName, js_ts_code_generator_1.data.uint8ArrayType, js_ts_code_generator_1.data.callMethod(parameterBinary, "slice", [
            c.getNextIndex(lengthVar),
            nextIndexVar,
        ])),
        js_ts_code_generator_1.data.statementVariableDefinition(isBrowserName, js_ts_code_generator_1.data.typeBoolean, js_ts_code_generator_1.data.logicalOr(js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("process")), js_ts_code_generator_1.data.undefinedLiteral), js_ts_code_generator_1.data.equal(js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("process")), "title"), js_ts_code_generator_1.data.stringLiteral("browser")))),
        js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.variable(isBrowserName), [
            c.returnStatement(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.newExpr(js_ts_code_generator_1.data.globalObjects(js_ts_code_generator_1.identifer.fromString("TextDecoder")), []), "decode", [textBinaryVar]), nextIndexVar),
        ]),
        c.returnStatement(js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.newExpr(js_ts_code_generator_1.data.importedVariable("util", js_ts_code_generator_1.identifer.fromString("TextDecoder")), []), "decode", [textBinaryVar]), nextIndexVar),
    ]);
};
