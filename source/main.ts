import * as elm from "./elm";
import * as typeDefinitionTypeScript from "./typescript/typeDefinition";
import * as binaryConverterTypeScriptEncoder from "./typescript/encoder";
import * as binaryConverterTypeScriptDecoder from "./typescript/decoder";
import * as type from "./type";
import * as generator from "js-ts-code-generator";

export {
  elm,
  typeDefinitionTypeScript,
  binaryConverterTypeScriptEncoder,
  type
};

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<type.CustomType>,
  isBrowser: boolean
): generator.data.Code => {
  return {
    exportDefinitionList: [
      ...typeDefinitionTypeScript.generateCode(customTypeList),
      ...binaryConverterTypeScriptEncoder.generateCode(
        customTypeList,
        isBrowser
      ),
      ...binaryConverterTypeScriptDecoder.generateCode(
        customTypeList,
        isBrowser
      )
    ],
    statementList: []
  };
};
