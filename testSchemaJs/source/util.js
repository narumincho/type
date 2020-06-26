"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirstLowerCaseName = exports.isFirstUpperCaseName = exports.firstLowerCase = exports.firstUpperCase = exports.isIncludeBinaryType = exports.collectIdOrTokenTypeNameSet = exports.isTagTypeAllNoParameter = exports.toTypeName = exports.nextIndexProperty = exports.resultProperty = exports.decodePropertyName = exports.encodePropertyName = exports.codecPropertyName = exports.moduleName = exports.typeToMemberOrParameterName = exports.typeToTypeScriptType = void 0;
const js_ts_code_generator_1 = require("js-ts-code-generator");
exports.typeToTypeScriptType = (type_) => {
    switch (type_._) {
        case "Int32":
            return js_ts_code_generator_1.data.typeNumber;
        case "String":
            return js_ts_code_generator_1.data.typeString;
        case "Bool":
            return js_ts_code_generator_1.data.typeBoolean;
        case "Binary":
            return js_ts_code_generator_1.data.uint8ArrayType;
        case "List":
            return js_ts_code_generator_1.data.readonlyArrayType(exports.typeToTypeScriptType(type_.type_));
        case "Maybe":
            return js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInGlobal(js_ts_code_generator_1.identifer.fromString("Maybe")), [exports.typeToTypeScriptType(type_.type_)]);
        case "Result":
            return js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInGlobal(js_ts_code_generator_1.identifer.fromString("Result")), [
                exports.typeToTypeScriptType(type_.okAndErrorType.error),
                exports.typeToTypeScriptType(type_.okAndErrorType.ok),
            ]);
        case "Id":
        case "Token":
            return js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(type_.string_));
        case "Custom": {
            if (type_.nameAndTypeParameterList.parameterList.length === 0) {
                return js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(type_.nameAndTypeParameterList.name));
            }
            return js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(type_.nameAndTypeParameterList.name)), type_.nameAndTypeParameterList.parameterList.map(exports.typeToTypeScriptType));
        }
        case "Parameter":
            return js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(type_.string_));
    }
};
exports.typeToMemberOrParameterName = (type_) => {
    return js_ts_code_generator_1.identifer.fromString(exports.firstLowerCase(exports.toTypeName(type_)));
};
exports.moduleName = "@narumincho/type";
exports.codecPropertyName = "codec";
exports.encodePropertyName = "encode";
exports.decodePropertyName = "decode";
exports.resultProperty = "result";
exports.nextIndexProperty = "nextIndex";
exports.toTypeName = (type_) => {
    switch (type_._) {
        case "Int32":
            return "Int32";
        case "String":
            return "String";
        case "Bool":
            return "Bool";
        case "Binary":
            return "Binary";
        case "List":
            return exports.toTypeName(type_.type_) + "List";
        case "Maybe":
            return exports.toTypeName(type_.type_) + "Maybe";
        case "Result":
            return (exports.toTypeName(type_.okAndErrorType.error) +
                exports.toTypeName(type_.okAndErrorType.ok) +
                "Result");
        case "Id":
        case "Token":
            return type_.string_;
        case "Custom":
            return type_.nameAndTypeParameterList.name;
        case "Parameter":
            return type_.string_;
    }
};
exports.isTagTypeAllNoParameter = (tagNameAndParameterArray) => tagNameAndParameterArray.every((tagNameAndParameter) => tagNameAndParameter.parameter._ === "Nothing");
exports.collectIdOrTokenTypeNameSet = (customTypeList) => flatIdAndTokenNameSetList(customTypeList.map(collectIdOrTokenTypeNameSetInCustomType));
const collectIdOrTokenTypeNameSetInCustomType = (customType) => {
    switch (customType.body._) {
        case "Product":
            return flatIdAndTokenNameSetList(customType.body.memberList.map((memberNameAndType) => getIdAndTokenTypeNameInType(memberNameAndType.type)));
        case "Sum":
            return collectIdOrTokenTypeNameSetInSum(customType.body.patternList);
    }
};
const collectIdOrTokenTypeNameSetInSum = (tagNameAndParameterList) => {
    const idSet = new Set();
    const tokenSet = new Set();
    for (const memberNameAndType of tagNameAndParameterList) {
        switch (memberNameAndType.parameter._) {
            case "Just": {
                const idAndTokenNameSet = getIdAndTokenTypeNameInType(memberNameAndType.parameter.value);
                for (const id of idAndTokenNameSet.id) {
                    idSet.add(id);
                }
                for (const token of idAndTokenNameSet.token) {
                    tokenSet.add(token);
                }
            }
        }
    }
    return {
        id: idSet,
        token: tokenSet,
    };
};
const getIdAndTokenTypeNameInType = (type_) => {
    switch (type_._) {
        case "Int32":
        case "String":
        case "Bool":
        case "Binary":
        case "Parameter":
            return { id: new Set(), token: new Set() };
        case "Id":
            return { id: new Set([type_.string_]), token: new Set() };
        case "Token":
            return { id: new Set(), token: new Set([type_.string_]) };
        case "List":
        case "Maybe":
            return getIdAndTokenTypeNameInType(type_.type_);
        case "Result":
            return flatIdAndTokenNameSetList([
                getIdAndTokenTypeNameInType(type_.okAndErrorType.ok),
                getIdAndTokenTypeNameInType(type_.okAndErrorType.error),
            ]);
        case "Custom":
            return flatIdAndTokenNameSetList(type_.nameAndTypeParameterList.parameterList.map(getIdAndTokenTypeNameInType));
    }
};
const flatIdAndTokenNameSetList = (list) => {
    const idSet = new Set();
    const tokenSet = new Set();
    for (const idAndToken of list) {
        for (const id of idAndToken.id) {
            idSet.add(id);
        }
        for (const name of idAndToken.token) {
            tokenSet.add(name);
        }
    }
    return {
        id: idSet,
        token: tokenSet,
    };
};
exports.isIncludeBinaryType = (customType) => {
    switch (customType.body._) {
        case "Product":
            return isIncludeBinaryTypeInProduct(customType.body.memberList);
        case "Sum":
            return isIncludeBinaryTypeInSum(customType.body.patternList);
    }
};
const isIncludeBinaryTypeInProduct = (memberList) => {
    for (const member of memberList) {
        if (isIncludeBinaryTypeInType(member.type)) {
            return true;
        }
    }
    return false;
};
const isIncludeBinaryTypeInSum = (patternList) => {
    for (const pattern of patternList) {
        switch (pattern.parameter._) {
            case "Just":
                if (isIncludeBinaryTypeInType(pattern.parameter.value)) {
                    return true;
                }
        }
    }
    return false;
};
const isIncludeBinaryTypeInType = (type_) => {
    switch (type_._) {
        case "Int32":
        case "String":
        case "Bool":
        case "Custom":
        case "Id":
        case "Token":
            return false;
        case "Binary":
            return true;
        case "List":
        case "Maybe":
            return isIncludeBinaryTypeInType(type_.type_);
        case "Result":
            return (isIncludeBinaryTypeInType(type_.okAndErrorType.ok) ||
                isIncludeBinaryTypeInType(type_.okAndErrorType.error));
        case "Parameter":
            return false;
    }
};
exports.firstUpperCase = (text) => text.substring(0, 1).toUpperCase() + text.substring(1);
exports.firstLowerCase = (text) => text.substring(0, 1).toLowerCase() + text.substring(1);
exports.isFirstUpperCaseName = (text) => {
    if (text === "") {
        return false;
    }
    if (!"ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(text[0])) {
        return false;
    }
    for (const char of text.slice(1)) {
        if (!"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(char)) {
            return false;
        }
    }
    return true;
};
exports.isFirstLowerCaseName = (text) => {
    if (text === "") {
        return false;
    }
    if (!"abcdefghijklmnopqrstuvwxyz".includes(text[0])) {
        return false;
    }
    for (const char of text.slice(1)) {
        if (!"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(char)) {
            return false;
        }
    }
    return true;
};
