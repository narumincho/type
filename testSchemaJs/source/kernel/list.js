"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableDefinition = exports.type = exports.name = void 0;
const c = require("./codec");
const int32 = require("./int32");
const util = require("../util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.name = js_ts_code_generator_1.identifer.fromString("List");
exports.type = (element) => js_ts_code_generator_1.data.readonlyArrayType(element);
const elementTypeName = js_ts_code_generator_1.identifer.fromString("element");
const elementCodecName = js_ts_code_generator_1.identifer.fromString("elementCodec");
const elementCodecVar = js_ts_code_generator_1.data.variable(elementCodecName);
const elementType = js_ts_code_generator_1.data.typeScopeInFile(elementTypeName);
exports.variableDefinition = () => ({
    name: exports.name,
    document: "リスト. JavaScriptのArrayで扱う",
    type_: js_ts_code_generator_1.data.typeObject(new Map([
        [
            util.codecPropertyName,
            {
                type_: c.codecTypeWithTypeParameter(js_ts_code_generator_1.data.typeScopeInGlobal(js_ts_code_generator_1.identifer.fromString("ReadonlyArray")), ["element"], true),
                document: "",
            },
        ],
    ])),
    expr: js_ts_code_generator_1.data.objectLiteral([
        js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, js_ts_code_generator_1.data.lambda([
            {
                name: elementCodecName,
                type_: c.codecType(elementType, true),
            },
        ], [elementTypeName], c.codecType(exports.type(elementType), true), [
            js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.objectLiteral([
                js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, encodeDefinition()),
                js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, decodeDefinition()),
            ])),
        ])),
    ]),
});
const encodeDefinition = () => {
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const elementName = js_ts_code_generator_1.identifer.fromString("element");
    return c.encodeLambda(exports.type(js_ts_code_generator_1.data.typeScopeInFile(elementTypeName)), (valueVar) => [
        js_ts_code_generator_1.data.statementLetVariableDefinition(resultName, js_ts_code_generator_1.data.arrayType(js_ts_code_generator_1.data.typeNumber), js_ts_code_generator_1.data.typeAssertion(int32.encode(true, js_ts_code_generator_1.data.get(valueVar, "length")), js_ts_code_generator_1.data.arrayType(js_ts_code_generator_1.data.typeNumber))),
        js_ts_code_generator_1.data.statementForOf(elementName, valueVar, [
            js_ts_code_generator_1.data.statementSet(js_ts_code_generator_1.data.variable(resultName), null, js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.variable(resultName), "concat", [
                js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(elementCodecVar, util.encodePropertyName), [
                    js_ts_code_generator_1.data.variable(elementName),
                ]),
            ])),
        ]),
        js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.variable(resultName)),
    ]);
};
const decodeDefinition = () => {
    const elementTypeVar = js_ts_code_generator_1.data.typeScopeInFile(elementTypeName);
    const resultName = js_ts_code_generator_1.identifer.fromString("result");
    const resultVar = js_ts_code_generator_1.data.variable(resultName);
    const lengthResultName = js_ts_code_generator_1.identifer.fromString("lengthResult");
    const lengthResultVar = js_ts_code_generator_1.data.variable(lengthResultName);
    const resultAndNextIndexName = js_ts_code_generator_1.identifer.fromString("resultAndNextIndex");
    const resultAndNextIndexVar = js_ts_code_generator_1.data.variable(resultAndNextIndexName);
    const nextIndexName = js_ts_code_generator_1.identifer.fromString("nextIndex");
    const nextIndexVar = js_ts_code_generator_1.data.variable(nextIndexName);
    return c.decodeLambda(js_ts_code_generator_1.data.readonlyArrayType(elementTypeVar), (parameterIndex, parameterBinary) => [
        js_ts_code_generator_1.data.statementVariableDefinition(lengthResultName, c.decodeReturnType(js_ts_code_generator_1.data.typeNumber), int32.decode(true, parameterIndex, parameterBinary)),
        js_ts_code_generator_1.data.statementLetVariableDefinition(nextIndexName, js_ts_code_generator_1.data.typeNumber, c.getNextIndex(lengthResultVar)),
        js_ts_code_generator_1.data.statementVariableDefinition(resultName, js_ts_code_generator_1.data.arrayType(elementTypeVar), js_ts_code_generator_1.data.arrayLiteral([])),
        js_ts_code_generator_1.data.statementFor(js_ts_code_generator_1.identifer.fromString("i"), c.getResult(lengthResultVar), [
            js_ts_code_generator_1.data.statementVariableDefinition(resultAndNextIndexName, c.decodeReturnType(elementTypeVar), js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(elementCodecVar, util.decodePropertyName), [
                nextIndexVar,
                parameterBinary,
            ])),
            js_ts_code_generator_1.data.statementEvaluateExpr(js_ts_code_generator_1.data.callMethod(resultVar, "push", [c.getResult(resultAndNextIndexVar)])),
            js_ts_code_generator_1.data.statementSet(nextIndexVar, null, c.getNextIndex(resultAndNextIndexVar)),
        ]),
        c.returnStatement(resultVar, parameterIndex),
    ]);
};
