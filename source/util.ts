import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "./type";
import * as c from "./case";

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
          typeToTypeScriptType(type_.okAndErrorType.error),
          typeToTypeScriptType(type_.okAndErrorType.ok),
        ]
      );

    case "Id":
    case "Token":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));

    case "Custom": {
      if (type_.nameAndTypeParameterList.parameterList.length === 0) {
        return ts.typeScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        );
      }
      return ts.typeWithParameter(
        ts.typeScopeInFile(
          identifer.fromString(type_.nameAndTypeParameterList.name)
        ),
        type_.nameAndTypeParameterList.parameterList.map(typeToTypeScriptType)
      );
    }

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

export const moduleName = "@narumincho/type";
