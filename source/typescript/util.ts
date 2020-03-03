import * as generator from "js-ts-code-generator";
import { data as ts } from "js-ts-code-generator";
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

    case "DateTime":
      return ts.dateType;

    case "List":
      return ts.readonlyArrayType(typeToGeneratorType(type_.type_));

    case "Maybe":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(generator.identifer.fromString("Maybe")),
        [typeToGeneratorType(type_.type_)]
      );
    case "Result":
      return ts.typeWithParameter(
        ts.typeScopeInGlobal(generator.identifer.fromString("Result")),
        [
          typeToGeneratorType(type_.resultType.error),
          typeToGeneratorType(type_.resultType.ok)
        ]
      );

    case "Id":
      return ts.typeScopeInFile(
        generator.identifer.fromString(type_.string_ + "Id")
      );
    case "Hash":
      return ts.typeScopeInFile(
        generator.identifer.fromString(type_.string_ + "Hash")
      );

    case "AccessToken":
      return ts.typeScopeInFile(generator.identifer.fromString("AccessToken"));

    case "Custom":
      return ts.typeScopeInFile(generator.identifer.fromString(type_.string_));
  }
};

export const typeToMemberOrParameterName = (
  type_: type.Type
): generator.identifer.Identifer => {
  return generator.identifer.fromString(
    c.firstLowerCase(type.toTypeName(type_))
  );
};

export const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    tagNameAndParameter => tagNameAndParameter.parameter._ === "Nothing"
  );
