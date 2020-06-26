"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTypeDefinition = exports.type = void 0;
const util = require("../util");
const data_1 = require("../data");
const js_ts_code_generator_1 = require("js-ts-code-generator");
const name = "Result";
exports.type = (okType, errorType, withKernel) => withKernel
    ? js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeScopeInFile(js_ts_code_generator_1.identifer.fromString(name)), [
        okType,
        errorType,
    ])
    : js_ts_code_generator_1.data.typeWithParameter(js_ts_code_generator_1.data.typeImported(util.moduleName, js_ts_code_generator_1.identifer.fromString(name)), [okType, errorType]);
exports.customTypeDefinition = {
    name,
    description: "成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
    typeParameterList: ["ok", "error"],
    body: data_1.CustomTypeDefinitionBody.Sum([
        {
            name: "Ok",
            description: "成功",
            parameter: data_1.Maybe.Just(data_1.Type.Parameter("ok")),
        },
        {
            name: "Error",
            description: "失敗",
            parameter: data_1.Maybe.Just(data_1.Type.Parameter("error")),
        },
    ]),
};
