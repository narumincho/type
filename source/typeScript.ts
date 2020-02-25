import * as generator from "js-ts-code-generator";
import * as type from "./type";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): generator.Code => {
  return {
    exportTypeAliasMap: new Map(),
    exportConstEnumMap: new Map(),
    exportFunctionMap: new Map(),
    statementList: []
  };
};
