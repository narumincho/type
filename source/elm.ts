import * as type from "./type";
import * as c from "./case";

export const generateCode = (
  moduleName: string,
  schema: type.Schema
): string => {
  return (
    moduleExportList(moduleName, schema.customTypeList) +
    "\n" +
    importList +
    "\n" +
    schema.customTypeList
      .map(customType => customTypeToCode(customType))
      .join("\n\n")
  );
};

const moduleExportList = (
  name: string,
  customTypeDictionary: ReadonlyArray<type.CustomType>
): string => {
  return (
    "module " +
    name +
    " exposing (" +
    customTypeDictionary
      .map(customType => {
        switch (customType.body._) {
          case "Sum":
            return name;
          case "Product":
            return name + "(..)";
        }
      })
      .join(", ") +
    ")"
  );
};

const importList = `
import Set
import Map
`;

const customTypeToCode = (customType: type.CustomType): string => {
  const comment = "{-| " + customType.description + " -}\n";
  switch (customType.body._) {
    case "Sum":
      return (
        comment +
        createType(customType.name, customType.body.tagNameAndParameterArray)
      );
    case "Product":
      return (
        comment +
        createTypeAlias(customType.name, customType.body.memberNameAndTypeArray)
      );
  }
};

const createType = (
  name: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): string =>
  "type " +
  name +
  "\n  = " +
  tagNameAndParameterArray
    .map(tagNameAndParameter => {
      switch (tagNameAndParameter.parameter._) {
        case "Just":
          return (
            tagNameAndParameter.name +
            " " +
            typeToElmType(tagNameAndParameter.parameter.value)
          );
        case "Nothing":
          return tagNameAndParameter.name;
      }
    })
    .join("\n  | ") +
  "\n";

const createTypeAlias = (
  name: string,
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>
): string => {
  return (
    "type alias " +
    name +
    "= { " +
    memberNameAndTypeArray
      .map(
        memberNameAndType =>
          (isIdentifer(memberNameAndType.name)
            ? memberNameAndType.name + "_"
            : memberNameAndType.name) +
          ": " +
          typeToElmType(memberNameAndType.memberType)
      )
      .join(", ") +
    " }"
  );
};

const typeToElmType = (type_: type.Type): string => {
  switch (type_._) {
    case "UInt32":
      return "Int";
    case "String":
      return "String";
    case "Bool":
      return "Bool";
    case "DateTime":
      return "Time.Posix";
    case "Id":
    case "Token":
      return type_.string_;
    case "List":
      return "(List " + typeToElmType(type_.type_) + ")";
    case "Maybe":
      return "(Maybe " + typeToElmType(type_.type_) + ")";
    case "Result":
      return (
        "(Result" +
        typeToElmType(type_.resultType.error) +
        " " +
        typeToElmType(type_.resultType.ok) +
        ")"
      );
    case "Custom":
      return customTypeToTypeName(type_.string_);
  }
};

const customTypeToTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName);

const isIdentifer = (name: string): boolean => identiferList.includes(name);

const identiferList = [
  "if",
  "then",
  "else",
  "case",
  "of",
  "let",
  "in",
  "type",
  "module",
  "where",
  "import",
  "port",
  "exposing",
  "as",
  "alias"
];
