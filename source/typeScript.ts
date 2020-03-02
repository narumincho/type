import * as generator from "js-ts-code-generator";
import { data } from "js-ts-code-generator";
import * as type from "./type";
import * as c from "./case";

export const typeToGeneratorType = (type_: type.Type): data.Type => {
  switch (type_._) {
    case "UInt32":
      return data.typeNumber;

    case "String":
      return data.typeString;

    case "Bool":
      return data.typeBoolean;

    case "DateTime":
      return data.dateType;

    case "List":
      return data.readonlyArrayType(typeToGeneratorType(type_.type_));

    case "Maybe":
      return data.typeWithParameter(
        data.typeScopeInGlobal(generator.identifer.fromString("Maybe")),
        [typeToGeneratorType(type_.type_)]
      );
    case "Result":
      return data.typeWithParameter(
        data.typeScopeInGlobal(generator.identifer.fromString("Result")),
        [
          typeToGeneratorType(type_.resultType.error),
          typeToGeneratorType(type_.resultType.ok)
        ]
      );

    case "Id":
      return data.typeScopeInFile(
        generator.identifer.fromString(type_.string_ + "Id")
      );
    case "Hash":
      return data.typeScopeInFile(
        generator.identifer.fromString(type_.string_ + "Hash")
      );

    case "AccessToken":
      return data.typeScopeInFile(
        generator.identifer.fromString("AccessToken")
      );

    case "Custom":
      return data.typeScopeInFile(
        generator.identifer.fromString(type_.string_)
      );
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
