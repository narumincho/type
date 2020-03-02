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
): generator.data.Code => {
  return {
    exportDefinitionList: [
      ...typeDefinitionTypeScript.generateCode(customTypeDictionary),
      ...binaryConverterTypeScriptEncoder.generateCode(
        customTypeDictionary,
        isBrowser
      ),
      ...binaryConverterTypeScriptDecoder.generateCode(
        customTypeDictionary,
        isBrowser
      )
    ],
    statementList: []
  };
};
