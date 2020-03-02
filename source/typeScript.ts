import * as generator from "js-ts-code-generator";
import { data } from "js-ts-code-generator";
import * as type from "./type";
import * as c from "./case";

export const customTypeNameToEnumName = (customTypeName: string): string =>
  customTypeToTypeName(customTypeName) + "_";

export const typeToGeneratorType = (type_: type.Type): data.Type => {
  switch (type_._) {
    case "UInt32":
      return data.typeNumber;
    case "String":
      return data.typeString;
    case "Bool":
      return data.typeBoolean;
    case "List":
      return generator.typeExpr.readonlyArrayType(
        typeToGeneratorType(type_.type_)
      );
    case "Id":
      return data.typeScopeInFile(
        generator.identifer.fromString(type_.string_ + "Id")
      );
    case "Hash":
      return generator.typeExpr.globalType(
        customTypeToTypeName(type_.string_) + "Hash"
      );
    case "AccessToken":
      return generator.typeExpr.globalType("AccessToken");

    case "Custom":
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

export const tagNameToEnumTag = (tagName: string): string => {
  const name = c.firstUpperCase(tagName);
  if (generator.identifer.isIdentifer(name)) {
    return name;
  }
  return name + "_";
};

export const exprEnum = (
  customTypeName: string,
  tagName: string,
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): generator.expr.Expr => {
  const customType = customTypeDictionary.get(customTypeName);
  if (customType === undefined) {
    throw new Error(
      "customTypeの定義を見つけられなかった customType=" + customTypeName
    );
  }
  switch (customType.body._) {
    case "Sum":
      if (
        isProductTypeAllNoParameter(customType.body.tagNameAndParameterArray)
      ) {
        return generator.expr.enumTag(
          customTypeToTypeName(customTypeName),
          tagNameToEnumTag(tagName)
        );
      }
      return generator.expr.enumTag(
        customTypeNameToEnumName(customTypeName),
        tagNameToEnumTag(tagName)
      );
    case "Product":
      throw new Error("enumを取得するのにcustom typeがsumじゃなかった");
  }
};

export const isProductTypeAllNoParameter = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): boolean =>
  tagNameAndParameterArray.every(
    tagNameAndParameter =>
      tagNameAndParameter.parameter._ === type.TagParameter_.Nothing
  );
