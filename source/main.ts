import * as elm from "./elm";
import * as typeDefinition from "./typeScript/typeDefinition";
import * as encoder from "./typeScript/encoder";
import * as decoder from "./typeScript/decoder";
import * as tag from "./typeScript/tag";
import * as type from "./type";
import { data } from "js-ts-code-generator";

export { type };

export const generateTypeScriptCode = (
  customTypeList: ReadonlyArray<type.CustomType>
): data.Code => {
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return {
    exportDefinitionList: [
      ...typeDefinition
        .generateTypeDefinition(customTypeList, idOrTokenTypeNameSet)
        .map(data.definitionTypeAlias),
      ...tag.generate(customTypeList),
      ...encoder.generateCode(customTypeList).map(data.definitionFunction),
      ...decoder.generateCode(customTypeList).map(data.definitionFunction)
    ],
    statementList: []
  };
};

export const generateElmCode = (
  moduleName: string,
  customTypeList: ReadonlyArray<type.CustomType>
): string => {
  const idOrTokenTypeNameSet = type.collectIdOrTokenTypeNameSet(customTypeList);
  return elm.generateCode(moduleName, customTypeList, idOrTokenTypeNameSet);
};
