"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTypeVar = exports.generate = void 0;
const binary = require("./kernel/binary");
const bool = require("./kernel/bool");
const codec = require("./kernel/codec");
const data = require("./data");
const hexString = require("./kernel/hexString");
const int32 = require("./kernel/int32");
const kernelString = require("./kernel/string");
const list = require("./kernel/list");
const maybe = require("./kernel/maybe");
const result = require("./kernel/result");
const util = require("./util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.generate = (customTypeList, idAndTokenNameSet, withKernel) => {
    if (withKernel) {
        const customTypeAndDefaultTypeList = [
            maybe.customTypeDefinition,
            result.customTypeDefinition,
            ...customTypeList,
        ];
        return [
            int32.variableDefinition(),
            kernelString.exprDefinition(),
            bool.variableDefinition(),
            binary.variableDefinition(),
            list.variableDefinition(),
            hexString.idKernelExprDefinition,
            hexString.tokenKernelExprDefinition,
            ...[...idAndTokenNameSet.id].map((name) => hexString.idVariableDefinition(name, true)),
            ...[...idAndTokenNameSet.token].map((name) => hexString.tokenVariableDefinition(name, true)),
            ...customTypeAndDefaultTypeList.map((customTypeAndDefaultType) => customTypeDefinitionToTagVariable(customTypeAndDefaultType, true)),
        ];
    }
    return [
        ...[...idAndTokenNameSet.id].map((name) => hexString.idVariableDefinition(name, true)),
        ...[...idAndTokenNameSet.token].map((name) => hexString.tokenVariableDefinition(name, true)),
        ...customTypeList.map((customTypeAndDefaultType) => customTypeDefinitionToTagVariable(customTypeAndDefaultType, false)),
    ];
};
/*
 * ========================================
 *                Custom
 * ========================================
 */
const customTypeNameIdentifer = (customTypeName, tagName) => {
    return js_ts_code_generator_1.identifer.fromString(util.firstLowerCase(customTypeName) + util.firstUpperCase(tagName));
};
exports.customTypeVar = (customTypeName, tagName) => js_ts_code_generator_1.data.variable(customTypeNameIdentifer(customTypeName, tagName));
const customTypeDefinitionToTagVariable = (customType, withKernel) => {
    return {
        name: js_ts_code_generator_1.identifer.fromString(customType.name),
        document: customType.description,
        type_: customTypeDefinitionToType(customType, withKernel),
        expr: customTypeDefinitionToExpr(customType, withKernel),
    };
};
const customTypeDefinitionToType = (customType, withKernel) => {
    switch (customType.body._) {
        case "Product":
            return js_ts_code_generator_1.data.typeObject(new Map([
                [
                    util.codecPropertyName,
                    {
                        type_: customTypeToCodecType(customType, withKernel),
                        document: "",
                    },
                ],
            ]));
        case "Sum":
            return js_ts_code_generator_1.data.typeObject(new Map(customType.body.patternList
                .map((pattern) => [
                pattern.name,
                {
                    type_: tagNameAndParameterToTagExprType(js_ts_code_generator_1.identifer.fromString(customType.name), customType.typeParameterList, pattern),
                    document: pattern.description,
                },
            ])
                .concat([
                [
                    util.codecPropertyName,
                    {
                        type_: customTypeToCodecType(customType, withKernel),
                        document: "",
                    },
                ],
            ])));
    }
};
const customTypeDefinitionToExpr = (customType, withKernel) => {
    switch (customType.body._) {
        case "Product":
            return js_ts_code_generator_1.data.objectLiteral(customTypeToCodecDefinitionMember(customType, withKernel));
        case "Sum": {
            const { patternList } = customType.body;
            return js_ts_code_generator_1.data.objectLiteral(patternList
                .map((pattern) => js_ts_code_generator_1.data.memberKeyValue(pattern.name, util.isTagTypeAllNoParameter(patternList)
                ? js_ts_code_generator_1.data.stringLiteral(pattern.name)
                : patternToTagExpr(js_ts_code_generator_1.identifer.fromString(customType.name), customType.typeParameterList, pattern)))
                .concat(customTypeToCodecDefinitionMember(customType, withKernel)));
        }
    }
};
const tagNameAndParameterToTagExprType = (typeName, typeParameterList, pattern) => {
    const typeParameterIdentiferList = typeParameterList.map(js_ts_code_generator_1.identifer.fromString);
    const returnType = js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(typeName), typeParameterIdentiferList.map((typeParameterIdentifer) => js_ts_code_generator_1.data.typeScopeInFile(typeParameterIdentifer)));
    switch (pattern.parameter._) {
        case "Just":
            return js_ts_code_generator_1.data.typeFunction(typeParameterIdentiferList, [util.typeToTypeScriptType(pattern.parameter.value)], returnType);
        case "Nothing":
            if (typeParameterList.length === 0) {
                return returnType;
            }
            return js_ts_code_generator_1.data.typeFunction(typeParameterIdentiferList, [], returnType);
    }
};
const patternToTagExpr = (typeName, typeParameterList, pattern) => {
    const tagField = js_ts_code_generator_1.data.memberKeyValue("_", js_ts_code_generator_1.data.stringLiteral(pattern.name));
    const returnType = js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(typeName), typeParameterList.map((typeParameter) => js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter))));
    switch (pattern.parameter._) {
        case "Just":
            return js_ts_code_generator_1.data.lambda([
                {
                    name: util.typeToMemberOrParameterName(pattern.parameter.value),
                    type_: util.typeToTypeScriptType(pattern.parameter.value),
                },
            ], typeParameterList.map(js_ts_code_generator_1.identifer.fromString), returnType, [
                js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.objectLiteral([
                    tagField,
                    js_ts_code_generator_1.data.memberKeyValue(util.typeToMemberOrParameterName(pattern.parameter.value), js_ts_code_generator_1.data.variable(util.typeToMemberOrParameterName(pattern.parameter.value))),
                ])),
            ]);
        case "Nothing":
            if (typeParameterList.length === 0) {
                return js_ts_code_generator_1.data.objectLiteral([tagField]);
            }
            return js_ts_code_generator_1.data.lambda([], typeParameterList.map(js_ts_code_generator_1.identifer.fromString), returnType, [js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.objectLiteral([tagField]))]);
    }
};
/** カスタム型の式のcodecプロパティの型 */
const customTypeToCodecType = (customTypeDefinition, withKernel) => codec.codecTypeWithTypeParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(customTypeDefinition.name)), customTypeDefinition.typeParameterList, withKernel);
const customTypeToCodecDefinitionMember = (customType, withKernel) => {
    return [
        js_ts_code_generator_1.data.memberKeyValue(util.codecPropertyName, codecExprDefinition(customType, withKernel)),
    ];
};
const codecParameterName = (name) => js_ts_code_generator_1.identifer.fromString(name + "Codec");
const codecExprDefinition = (customTypeDefinition, withKernel) => {
    if (customTypeDefinition.typeParameterList.length === 0) {
        return codecDefinitionBodyExpr(customTypeDefinition, withKernel);
    }
    return js_ts_code_generator_1.data.lambda(customTypeDefinition.typeParameterList.map((typeParameter) => ({
        name: codecParameterName(typeParameter),
        type_: codec.codecType(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)), withKernel),
    })), customTypeDefinition.typeParameterList.map(js_ts_code_generator_1.identifer.fromString), codec.codecType(js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(customTypeDefinition.name)), customTypeDefinition.typeParameterList.map((typeParameter) => js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)))), withKernel), [
        js_ts_code_generator_1.data.statementReturn(codecDefinitionBodyExpr(customTypeDefinition, withKernel)),
    ]);
};
const codecDefinitionBodyExpr = (customTypeDefinition, withKernel) => {
    return js_ts_code_generator_1.data.objectLiteral([
        js_ts_code_generator_1.data.memberKeyValue(util.encodePropertyName, encodeExprDefinition(customTypeDefinition, withKernel)),
        js_ts_code_generator_1.data.memberKeyValue(util.decodePropertyName, decodeExprDefinition(customTypeDefinition, withKernel)),
    ]);
};
/**
 * Encode Definition
 */
const encodeExprDefinition = (customTypeDefinition, withKernel) => codec.encodeLambda(js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(customTypeDefinition.name)), customTypeDefinition.typeParameterList.map((typeParameter) => js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)))), (valueVar) => {
    switch (customTypeDefinition.body._) {
        case "Product":
            return productEncodeDefinitionStatementList(customTypeDefinition.body.memberList, valueVar, withKernel);
        case "Sum":
            return sumEncodeDefinitionStatementList(customTypeDefinition.body.patternList, valueVar, withKernel);
    }
});
const productEncodeDefinitionStatementList = (memberList, parameter, withKernel) => {
    if (memberList.length === 0) {
        return [js_ts_code_generator_1.data.statementReturn(js_ts_code_generator_1.data.arrayLiteral([]))];
    }
    let e = js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(codecExprUse(memberList[0].type, withKernel), util.encodePropertyName), [js_ts_code_generator_1.data.get(parameter, memberList[0].name)]);
    for (const member of memberList.slice(1)) {
        e = js_ts_code_generator_1.data.callMethod(e, "concat", [
            js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(codecExprUse(member.type, withKernel), util.encodePropertyName), [js_ts_code_generator_1.data.get(parameter, member.name)]),
        ]);
    }
    return [js_ts_code_generator_1.data.statementReturn(e)];
};
const sumEncodeDefinitionStatementList = (patternList, parameter, withKernel) => {
    if (util.isTagTypeAllNoParameter(patternList)) {
        return [
            js_ts_code_generator_1.data.statementSwitch({
                expr: parameter,
                patternList: patternList.map((pattern, index) => patternToSwitchPattern(pattern, index, parameter, withKernel)),
            }),
        ];
    }
    return [
        js_ts_code_generator_1.data.statementSwitch({
            expr: js_ts_code_generator_1.data.get(parameter, "_"),
            patternList: patternList.map((tagNameAndParameter, index) => patternToSwitchPattern(tagNameAndParameter, index, parameter, withKernel)),
        }),
    ];
};
const patternToSwitchPattern = (patternList, index, parameter, withKernel) => {
    const returnExpr = (() => {
        switch (patternList.parameter._) {
            case "Just":
                return js_ts_code_generator_1.data.callMethod(js_ts_code_generator_1.data.arrayLiteral([{ expr: js_ts_code_generator_1.data.numberLiteral(index), spread: false }]), "concat", [
                    encodeExprUse(withKernel, patternList.parameter.value, js_ts_code_generator_1.data.get(parameter, util.typeToMemberOrParameterName(patternList.parameter.value))),
                ]);
            case "Nothing":
                return js_ts_code_generator_1.data.arrayLiteral([
                    { expr: js_ts_code_generator_1.data.numberLiteral(index), spread: false },
                ]);
        }
    })();
    return {
        caseTag: patternList.name,
        statementList: [js_ts_code_generator_1.data.statementReturn(returnExpr)],
    };
};
/**
 * Decode Definition
 */
const decodeExprDefinition = (customTypeDefinition, withKernel) => {
    return codec.decodeLambda(js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(customTypeDefinition.name)), customTypeDefinition.typeParameterList.map((typeParameter) => js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(typeParameter)))), (parameterIndex, parameterBinary) => {
        switch (customTypeDefinition.body._) {
            case "Product":
                return productDecodeDefinitionStatementList(withKernel, customTypeDefinition.body.memberList, parameterIndex, parameterBinary);
            case "Sum":
                return sumDecodeDefinitionStatementList(withKernel, customTypeDefinition.body.patternList, customTypeDefinition.name, parameterIndex, parameterBinary, customTypeDefinition.typeParameterList.length === 0);
        }
    });
};
const productDecodeDefinitionStatementList = (withKernel, memberList, parameterIndex, parameterBinary) => {
    const resultAndNextIndexNameIdentifer = (member) => js_ts_code_generator_1.identifer.fromString(member.name + "AndNextIndex");
    const memberDecoderCode = memberList.reduce((statementAndNextIndexExpr, memberNameAndType) => {
        const resultAndNextIndexName = resultAndNextIndexNameIdentifer(memberNameAndType);
        const resultAndNextIndexVar = js_ts_code_generator_1.data.variable(resultAndNextIndexName);
        return {
            nextIndexExpr: codec.getNextIndex(resultAndNextIndexVar),
            statementList: statementAndNextIndexExpr.statementList.concat(js_ts_code_generator_1.data.statementVariableDefinition(resultAndNextIndexName, codec.decodeReturnType(util.typeToTypeScriptType(memberNameAndType.type)), decodeExprUse(withKernel, memberNameAndType.type, statementAndNextIndexExpr.nextIndexExpr, parameterBinary))),
        };
    }, { nextIndexExpr: parameterIndex, statementList: [] });
    return memberDecoderCode.statementList.concat(codec.returnStatement(js_ts_code_generator_1.data.objectLiteral(memberList.map((memberNameAndType) => js_ts_code_generator_1.data.memberKeyValue(memberNameAndType.name, codec.getResult(js_ts_code_generator_1.data.variable(resultAndNextIndexNameIdentifer(memberNameAndType)))))), memberDecoderCode.nextIndexExpr));
};
const sumDecodeDefinitionStatementList = (withKernel, patternList, customTypeName, parameterIndex, parameterBinary, noTypeParameter) => {
    const patternIndexAndNextIndexName = js_ts_code_generator_1.identifer.fromString("patternIndex");
    const patternIndexAndNextIndexVar = js_ts_code_generator_1.data.variable(patternIndexAndNextIndexName);
    return [
        js_ts_code_generator_1.data.statementVariableDefinition(patternIndexAndNextIndexName, codec.decodeReturnType(js_ts_code_generator_1.data.typeNumber), int32.decode(withKernel, parameterIndex, parameterBinary)),
        ...patternList.map((pattern, index) => tagNameAndParameterCode(withKernel, customTypeName, pattern, index, patternIndexAndNextIndexVar, parameterBinary, noTypeParameter)),
        js_ts_code_generator_1.data.statementThrowError(js_ts_code_generator_1.data.stringLiteral("存在しないパターンを指定された 型を更新してください")),
    ];
};
const tagNameAndParameterCode = (withKernel, customTypeName, pattern, index, patternIndexAndNextIndexVar, parameterBinary, noTypeParameter) => {
    switch (pattern.parameter._) {
        case "Just":
            return js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.equal(codec.getResult(patternIndexAndNextIndexVar), js_ts_code_generator_1.data.numberLiteral(index)), [
                js_ts_code_generator_1.data.statementVariableDefinition(js_ts_code_generator_1.identifer.fromString("result"), codec.decodeReturnType(util.typeToTypeScriptType(pattern.parameter.value)), decodeExprUse(withKernel, pattern.parameter.value, codec.getNextIndex(patternIndexAndNextIndexVar), parameterBinary)),
                codec.returnStatement(patternUse(customTypeName, noTypeParameter, pattern.name, data.Maybe.Just(codec.getResult(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("result"))))), codec.getNextIndex(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("result")))),
            ]);
        case "Nothing":
            return js_ts_code_generator_1.data.statementIf(js_ts_code_generator_1.data.equal(codec.getResult(patternIndexAndNextIndexVar), js_ts_code_generator_1.data.numberLiteral(index)), [
                codec.returnStatement(patternUse(customTypeName, noTypeParameter, pattern.name, data.Maybe.Nothing()), codec.getNextIndex(patternIndexAndNextIndexVar)),
            ]);
    }
};
const patternUse = (customTypeName, noTypeParameter, tagName, parameter) => {
    const tagExpr = js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString(customTypeName)), tagName);
    switch (parameter._) {
        case "Just":
            return js_ts_code_generator_1.data.call(tagExpr, [parameter.value]);
        case "Nothing":
            if (noTypeParameter) {
                return tagExpr;
            }
            return js_ts_code_generator_1.data.call(tagExpr, []);
    }
};
const encodeExprUse = (withKernel, type_, target) => js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(codecExprUse(type_, withKernel), util.encodePropertyName), [
    target,
]);
const decodeExprUse = (withKernel, type_, indexExpr, binaryExpr) => js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(codecExprUse(type_, withKernel), util.decodePropertyName), [
    indexExpr,
    binaryExpr,
]);
const codecExprUse = (type_, withKernel) => {
    switch (type_._) {
        case "Int32":
            return int32.codec(withKernel);
        case "String":
            return kernelString.codec(withKernel);
        case "Bool":
            return bool.codec(withKernel);
        case "Binary":
            return binary.codec(withKernel);
        case "List":
            return js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(withKernel
                ? js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("List"))
                : js_ts_code_generator_1.data.importedVariable(util.moduleName, js_ts_code_generator_1.identifer.fromString("List")), util.codecPropertyName), [codecExprUse(type_.type_, withKernel)]);
        case "Maybe":
            return js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(withKernel
                ? js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("Maybe"))
                : js_ts_code_generator_1.data.importedVariable(util.moduleName, js_ts_code_generator_1.identifer.fromString("Maybe")), util.codecPropertyName), [codecExprUse(type_.type_, withKernel)]);
        case "Result":
            return js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(withKernel
                ? js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString("Result"))
                : js_ts_code_generator_1.data.importedVariable(util.moduleName, js_ts_code_generator_1.identifer.fromString("Result")), util.codecPropertyName), [
                codecExprUse(type_.okAndErrorType.ok, withKernel),
                codecExprUse(type_.okAndErrorType.error, withKernel),
            ]);
        case "Id":
            return js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString(type_.string_)), util.codecPropertyName);
        case "Token":
            return js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString(type_.string_)), util.codecPropertyName);
        case "Custom":
            if (type_.nameAndTypeParameterList.parameterList.length === 0) {
                return js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString(type_.nameAndTypeParameterList.name)), util.codecPropertyName);
            }
            return js_ts_code_generator_1.data.call(js_ts_code_generator_1.data.get(js_ts_code_generator_1.data.variable(js_ts_code_generator_1.identifer.fromString(type_.nameAndTypeParameterList.name)), util.codecPropertyName), type_.nameAndTypeParameterList.parameterList.map((parameter) => codecExprUse(parameter, withKernel)));
        case "Parameter":
            return js_ts_code_generator_1.data.variable(codecParameterName(type_.string_));
    }
};
