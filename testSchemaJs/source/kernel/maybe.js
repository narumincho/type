"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTypeDefinition = exports.type = void 0;
const util = require("../util");
const data_1 = require("../data");
const js_ts_code_generator_1 = require("js-ts-code-generator");
const name = "Maybe";
exports.type = (elementType, widthKernel) => widthKernel
    ? js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(name)), [
        elementType,
    ])
    : js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeImported(util.moduleName, js_ts_code_generator_1.identifer.fromString(name)), [elementType]);
exports.customTypeDefinition = {
    name,
    typeParameterList: ["value"],
    description: "Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
    body: data_1.CustomTypeDefinitionBody.Sum([
        {
            name: "Just",
            description: "値があるということ",
            parameter: data_1.Maybe.Just(data_1.Type.Parameter("value")),
        },
        {
            name: "Nothing",
            description: "値がないということ",
            parameter: data_1.Maybe.Nothing(),
        },
    ]),
};
