import * as generator from "js-ts-code-generator";
import * as type from "./type";
import * as c from "./case";

export const customTypeNameToEnumName = (customTypeName: string): string =>
  customTypeToTypeName(customTypeName) + "_";

export const typeToGeneratorType = (
  type_: type.Type
): generator.typeExpr.TypeExpr => {
  switch (type_._) {
    case type.Type_.UInt32:
      return generator.typeExpr.typeNumber;
    case type.Type_.String:
      return generator.typeExpr.typeString;
    case type.Type_.Id:
      return generator.typeExpr.globalType(
        customTypeToTypeName(type_.string_) + "id"
      );
    case type.Type_.Hash:
      return generator.typeExpr.globalType(
        customTypeToTypeName(type_.string_) + "Hash"
      );
    case type.Type_.List:
      return generator.typeExpr.readonlyArrayType(
        typeToGeneratorType(type_.type_)
      );
    case type.Type_.Custom:
      return generator.typeExpr.globalType(customTypeToTypeName(type_.string_));
  }
};

export const typeToMemberOrParameterName = (type_: type.Type): string => {
  const name = c.firstLowerCase(type.toTypeName(type_));
  if (generator.identifer.isIdentifer(name)) {
    return name;
  }
  return name + "_";
};

export const customTypeToTypeName = (customTypeName: string): string => {
  const name = type.customTypeToTypeName(customTypeName);
  if (generator.identifer.isIdentifer(name)) {
    return name;
  }
  return name + "_";
};
