import * as elm from "./elm";
import * as typeDefinitionTypeScript from "./typeDefinition/typeScript";
import * as binaryConverterTypeScriptEncoder from "./binaryConverter/typeScript/encoder";
import * as binaryConverterTypeScriptDecoder from "./binaryConverter/typeScript/decoder";
import * as type from "./type";
import * as generator from "js-ts-code-generator";

export {
  elm,
  typeDefinitionTypeScript,
  binaryConverterTypeScriptEncoder,
  type
};

export const generateTypeScriptCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>,
  isBrowser: boolean
): generator.Code => {
  const typeDefinitionCode = typeDefinitionTypeScript.generateCode(
    customTypeDictionary
  );
  const encoderCode = binaryConverterTypeScriptEncoder.generateCode(
    customTypeDictionary,
    isBrowser
  );
  const decoderCode = binaryConverterTypeScriptDecoder.generateCode(
    customTypeDictionary,
    isBrowser
  );
  return {
    exportFunctionMap: new Map([
      ...typeDefinitionCode.exportFunctionMap,
      ...encoderCode,
      ...decoderCode
    ]),
    exportConstEnumMap: typeDefinitionCode.exportConstEnumMap,
    exportTypeAliasMap: typeDefinitionCode.exportTypeAliasMap,
    statementList: []
  };
};
