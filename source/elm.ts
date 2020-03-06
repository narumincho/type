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
    schema.customTypeList.map(customTypeToTypeDefinitionCode).join("\n\n") +
    "\n\n" +
    schema.customTypeList.map(customTypeToToJsonValueCode).join("\n\n")
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
import Json.Encode as Je
import Json.Decode as Jd
`;

const customTypeToTypeDefinitionCode = (
  customType: type.CustomType
): string => {
  switch (customType.body._) {
    case "Sum":
      return (
        commentToCode(customType.description) +
        createType(customType.name, customType.body.tagNameAndParameterArray)
      );
    case "Product":
      return (
        commentToCode(customType.description) +
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
    " = { " +
    memberNameAndTypeArray
      .map(
        memberNameAndType =>
          type.elmIdentiferFromString(memberNameAndType.name) +
          ": " +
          typeToElmType(memberNameAndType.memberType)
      )
      .join(", ") +
    " }"
  );
};

const customTypeToToJsonValueCode = (customType: type.CustomType): string => {
  const parameterName = type.elmIdentiferFromString(
    c.firstLowerCase(customType.name)
  );
  const body = ((): string => {
    switch (customType.body._) {
      case "Sum":
        return customTypeSumToToJsonValueCodeBody(
          customType.body.tagNameAndParameterArray,
          parameterName
        );
      case "Product":
        return customTypeProductToToJsonValueCodeBody(
          customType.body.memberNameAndTypeArray,
          parameterName
        );
    }
  })();

  return (
    commentToCode(customType.name + "のJSONへのエンコーダ") +
    toJsonCustomTypeFunctionName(customType.name) +
    " : " +
    customType.name +
    " -> Je.Value\n" +
    toJsonCustomTypeFunctionName(customType.name) +
    " " +
    parameterName +
    " =\n" +
    body
  );
};

const customTypeSumToToJsonValueCodeBody = (
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>,
  parameterName: string
): string => {
  const caseHeader = indentString + "case " + parameterName + " of\n";
  if (type.isProductTypeAllNoParameter(tagNameAndParameterArray)) {
    return (
      caseHeader +
      tagNameAndParameterArray
        .map(
          tagNameAndParameter =>
            indentString.repeat(2) +
            tagNameAndParameter.name +
            " ->\n" +
            indentString.repeat(3) +
            'Je.string "' +
            tagNameAndParameter.name +
            '"'
        )
        .join("\n")
    );
  }
  return (
    caseHeader +
    tagNameAndParameterArray
      .map(
        tagNameAndParameter =>
          indentString.repeat(2) +
          tagNameAndParameter.name +
          " ->\n" +
          indentString.repeat(3) +
          'Je.object [ ( "_", Je.string "' +
          tagNameAndParameter.name +
          '")' +
          (tagNameAndParameter.parameter._ === "Nothing"
            ? ""
            : ', ( "' +
              (type.typeToMemberOrParameterName(
                tagNameAndParameter.parameter.value
              ) as string) +
              '", ' +
              toJsonValueVarEval(
                tagNameAndParameter.parameter.value,
                parameterName +
                  "." +
                  (type.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  ) as string)
              ) +
              ")") +
          "]"
      )
      .join("\n")
  );
};

const customTypeProductToToJsonValueCodeBody = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>,
  parameterName: string
): string => {
  return (
    indentString +
    "Je.object\n" +
    indentString.repeat(2) +
    "[ " +
    memberNameAndTypeArray
      .map(
        memberNameAndType =>
          '( "' +
          memberNameAndType.name +
          '", ' +
          toJsonValueVarEval(
            memberNameAndType.memberType,
            parameterName + "." + memberNameAndType.name
          ) +
          " )"
      )
      .join("\n" + indentString.repeat(2) + ", ") +
    "\n" +
    indentString.repeat(2) +
    "]"
  );
};

const toJsonValueVarEval = (type_: type.Type, expr: string): string => {
  return "(" + toJsonValueFunction(type_) + " " + expr + ")";
};

const toJsonValueFunction = (type_: type.Type): string => {
  switch (type_._) {
    case "UInt32":
      return "Je.number";
    case "String":
      return "Je.string";
    case "Bool":
      return "Je.bool";
    case "DateTime":
      return '"DateTimeは未サポート"';
    case "Id":
      return "encode" + type_.string_;
    case "Token":
      return "encode" + type_.string_;
    case "List":
      return "Jd.list " + toJsonValueFunction(type_.type_);
    case "Maybe":
      return "encodeMaybe";
    case "Result":
      return "encodeResult";
    case "Custom":
      return toJsonCustomTypeFunctionName(type_.string_);
  }
};

const commentToCode = (comment: string): string =>
  comment === "" ? "" : "{-| " + comment + " -}\n";

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
      return type_.string_;
  }
};

const toJsonCustomTypeFunctionName = (customTypeName: string): string =>
  c.firstLowerCase(customTypeName) + "ToJsonValue";

const indentString = "    ";
