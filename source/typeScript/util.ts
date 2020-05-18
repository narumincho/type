import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as c from "../case";

export const typeToTypeScriptType = (type_: type.Type): ts.Type => {
  switch (type_._) {
    case "Int32":
      return ts.typeNumber;

    case "String":
      return ts.typeString;

    case "Bool":
      return ts.typeBoolean;

    case "Binary":
      return ts.uint8ArrayType;

    case "List":
      return ts.readonlyArrayType(typeToTypeScriptType(type_.type_));

    case "Maybe":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Maybe")),
        [typeToTypeScriptType(type_.type_)]
      );
    case "Result":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Result")),
        [
          typeToTypeScriptType(type_.resultType.error),
          typeToTypeScriptType(type_.resultType.ok),
        ]
      );

    case "Id":
    case "Token":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));

    case "Custom":
      return ts.typeWithParameter(
        ts.typeScopeInFile(identifer.fromString(type_.customType.name)),
        type_.customType.parameterList.map(typeToTypeScriptType)
      );

    case "Parameter":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));
  }
};

export const typeToMemberOrParameterName = (
  type_: type.Type
): identifer.Identifer => {
  console.log(type_);
  return identifer.fromString(c.firstLowerCase(type.toTypeName(type_)));
};
