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
    case type.CustomType_.Sum:
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
    case type.CustomType_.Product:
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
