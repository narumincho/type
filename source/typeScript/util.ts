import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as c from "../case";

export const typeToGeneratorType = (type_: type.Type): ts.Type => {
  switch (type_._) {
    case "UInt32":
      return ts.typeNumber;

    case "String":
      return ts.typeString;

    case "Bool":
      return ts.typeBoolean;

    case "List":
      return ts.readonlyArrayType(typeToGeneratorType(type_.type_));

    case "Maybe":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Maybe")),
        [typeToGeneratorType(type_.type_)]
      );
    case "Result":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(identifer.fromString("Result")),
        [
          typeToGeneratorType(type_.resultType.error),
          typeToGeneratorType(type_.resultType.ok)
        ]
      );

    case "Id":
    case "Token":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));

    case "Custom":
      return ts.typeScopeInFile(identifer.fromString(type_.string_));
  }
};

export const typeToMemberOrParameterName = (
  type_: type.Type
): identifer.Identifer => {
  return identifer.fromString(c.firstLowerCase(type.toTypeName(type_)));
};
