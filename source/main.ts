import * as elm from "./elm";
import * as typeDefinition from "./typeScript/typeDefinition";
import * as encoder from "./typeScript/encoder";
import * as decoder from "./typeScript/decoder";
import * as tag from "./typeScript/tag";
import * as type from "./type";
import { data } from "js-ts-code-generator";

export {
  elm,
  typeDefinition as typeDefinitionTypeScript,
  encoder as binaryConverterTypeScriptEncoder,
  type
};

export const generateTypeScriptCode = (schema: type.Schema): data.Code => {
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(schema)
        .map(data.definitionTypeAlias),
      ...tag.generate(schema.customTypeList),
      ...encoder
        .generateCode(schema.customTypeList)
        .map(data.definitionFunction),
      ...decoder
        .generateCode(schema.customTypeList)
        .map(data.definitionFunction)
    ],
    statementList: []
  };
};
