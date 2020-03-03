import * as elm from "./elm";
import * as typeDefinition from "./typescript/typeDefinition";
import * as encoder from "./typescript/encoder";
import * as decoder from "./typescript/decoder";
import * as tag from "./typeScript/tag";
import * as type from "./type";
import { data } from "js-ts-code-generator";

export {
  elm,
  typeDefinition as typeDefinitionTypeScript,
  encoder as binaryConverterTypeScriptEncoder,
  type
};

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<type.CustomType>,
  isBrowser: boolean
): data.Code => {
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList)
        .map(data.definitionTypeAlias),
      ...tag.generate(customTypeList),
      ...encoder.generateCode(customTypeList, isBrowser),
      ...decoder.generateCode(customTypeList, isBrowser)
    ],
    statementList: []
  };
};
