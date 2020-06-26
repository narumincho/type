"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTypeToDefinition = exports.generateTypeDefinition = void 0;
const codec = require("./kernel/codec");
const hexString = require("./kernel/hexString");
const maybe = require("./kernel/maybe");
const result = require("./kernel/result");
const util = require("./util");
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.generateTypeDefinition = (customTypeList, idOrTokenTypeNameSet, widthKernel) => {
    if (widthKernel) {
        return [
            codec.codecTypeDefinition(),
            exports.customTypeToDefinition(maybe.customTypeDefinition),
            exports.customTypeToDefinition(result.customTypeDefinition),
            ...customTypeList.map(exports.customTypeToDefinition),
            ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(hexString.typeDefinition),
        ];
    }
    return [
        ...customTypeList.map(exports.customTypeToDefinition),
        ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(hexString.typeDefinition),
    ];
};
/*
 * ========================================
 *             Custom Type
 * ========================================
 */
exports.customTypeToDefinition = (customType) => ({
    name: js_ts_code_generator_1.identifer.fromString(customType.name),
    document: customType.description,
    parameterList: customType.typeParameterList.map(js_ts_code_generator_1.identifer.fromString),
    type_: customTypeDefinitionBodyToTsType(customType.body),
});
const customTypeDefinitionBodyToTsType = (body) => {
    switch (body._) {
        case "Sum":
            if (util.isTagTypeAllNoParameter(body.patternList)) {
                return js_ts_code_generator_1.data.typeUnion(body.patternList.map((pattern) => js_ts_code_generator_1.data.typeStringLiteral(pattern.name)));
            }
            return js_ts_code_generator_1.data.typeUnion(body.patternList.map((pattern) => patternListToObjectType(pattern)));
        case "Product":
            return js_ts_code_generator_1.data.typeObject(new Map(body.memberList.map((member) => [
                member.name,
                {
                    type_: util.typeToTypeScriptType(member.type),
                    document: member.description,
                },
            ])));
    }
};
const patternListToObjectType = (patternList) => {
    const tagField = [
        "_",
        {
            document: "",
            type_: js_ts_code_generator_1.data.typeStringLiteral(patternList.name),
        },
    ];
    switch (patternList.parameter._) {
        case "Just":
            return js_ts_code_generator_1.data.typeObject(new Map([
                tagField,
                [
                    util.typeToMemberOrParameterName(patternList.parameter.value),
                    {
                        document: "",
                        type_: util.typeToTypeScriptType(patternList.parameter.value),
                    },
                ],
            ]));
        case "Nothing":
            return js_ts_code_generator_1.data.typeObject(new Map([tagField]));
    }
};
