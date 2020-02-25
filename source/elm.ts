import * as type from "./type";
import * as c from "./case";

export const generateCode = (
  moduleName: string,
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): string => {
  return (
    moduleExportList(moduleName, customTypeDictionary) +
    "\n" +
    importList +
    "\n" +
    [...customTypeDictionary.entries()]
      .map(([name, customType]) => customTypeToCode(name, customType))
      .join("\n\n")
  );
};

const moduleExportList = (
  name: string,
  customTypeDictionary: ReadonlyMap<string, type.CustomType>
): string => {
  return (
    "module " +
    name +
    " exposing (" +
    [...customTypeDictionary.entries()]
      .map(([name, customType]) => {
        switch (customType.body._) {
          case type.CustomType_.Sum:
            return name;
          case type.CustomType_.Product:
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

const customTypeToCode = (
  name: string,
  customType: type.CustomType
): string => {
  const comment = "{-| " + customType.description + " -}\n";
  switch (customType.body._) {
    case type.CustomType_.Product:
      return (
        comment + createType(name, customType.body.tagNameAndParameterArray)
      );
    case type.CustomType_.Sum:
      return (
        comment + createTypeAlias(name, customType.body.memberNameAndTypeArray)
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
        case type.TagParameter_.Just:
          return (
            tagNameAndParameter.name +
            " " +
            typeToElmType(tagNameAndParameter.parameter.type_)
          );
        case type.TagParameter_.Nothing:
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
    case type.Type_.UInt32:
      return "Int";
    case type.Type_.String:
      return "String";
    case type.Type_.Id:
      return customTypeToIdTypeName(type_.string_);
    case type.Type_.Hash:
      return customTypeToHashTypeName(type_.string_);
    case type.Type_.List:
      return "(List " + typeToElmType(type_.type_) + ")";
    case type.Type_.Dictionary:
      return (
        "(Map.Map " +
        typeToElmType(type_.dictionaryType.key) +
        " " +
        typeToElmType(type_.dictionaryType.value) +
        ")"
      );
    case type.Type_.Set:
      return "(Set.Set " + typeToElmType(type_.type_) + ")";
    case type.Type_.Custom: {
      return customTypeToTypeName(type_.string_);
    }
  }
};

const customTypeToIdTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName) + "Id";

const customTypeToHashTypeName = (customTypeName: string): string =>
  c.firstUpperCase(customTypeName) + "Hash";

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
