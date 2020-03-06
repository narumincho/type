import * as type from "./type";
import * as c from "./case";

export const generateCode = (
  moduleName: string,
  schema: type.Schema
): string => {
  return [
    moduleExportList(moduleName, schema.customTypeList),
    importList,
    ...schema.customTypeList.map(customTypeToTypeDefinitionCode),
    ...schema.idOrTokenTypeNameList.map(idOrTokenTypeToTypeDefinitionCode),
    maybeToJsonValueCode,
    resultToJsonValueCode,
    ...schema.idOrTokenTypeNameList.map(idOrTokenTypeToToJsonValueCode),
    ...schema.customTypeList.map(customTypeToToJsonValueCode),
    maybeJsonDecoder,
    resultJsonDecoder,
    ...schema.idOrTokenTypeNameList.map(idOrTokenToJsonDecoderCode)
  ].join("\n\n");
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
            return customType.name + "(..)";
          case "Product":
            return customType.name;
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

const idOrTokenTypeToTypeDefinitionCode = (
  idOrTokenTypeName: string
): string => {
  return "type " + idOrTokenTypeName + " = " + idOrTokenTypeName + " String";
};

const maybeToJsonValueCode = `
maybeToJsonValue : (a -> Je.Value) -> Maybe a -> Je.Value
maybeToJsonValue toJsonValueFunction maybe =
    case maybe of
        Just value ->
            Je.object [ ( "_", Je.string "Just" ), ( "value", toJsonValueFunction value ) ]

        Nothing ->
            Je.object [ ( "_", Je.string "Nothing" ) ]
`;

const resultToJsonValueCode = `
resultToJsonValue : (ok -> Je.Value) -> (error -> Je.Value) -> Result error ok -> Je.Value
resultToJsonValue okToJsonValueFunction errorToJsonValueFunction result =
    case result of
        Ok value ->
            Je.object [ ( "_", Je.string "Ok" ), ( "ok", okToJsonValueFunction result ) ]

        Err value ->
            Je.object [ ( "_", Je.string "Error" ), ( "error", errorToJsonValueFunction result ) ]
`;

const idOrTokenTypeToToJsonValueCode = (idOrTokenTypeName: string): string => {
  return (
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(idOrTokenTypeName) +
    " : " +
    idOrTokenTypeName +
    " -> Je.Value\n" +
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(idOrTokenTypeName) +
    " (" +
    idOrTokenTypeName +
    " string) = \n" +
    indentString +
    "Je.string string"
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
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(customType.name) +
    " : " +
    customType.name +
    " -> Je.Value\n" +
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(customType.name) +
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
      return "Je.int";
    case "String":
      return "Je.string";
    case "Bool":
      return "Je.bool";
    case "DateTime":
      return '"DateTimeは未サポート"';
    case "List":
      return "Je.list (" + toJsonValueFunction(type_.type_) + ")";
    case "Maybe":
      return "maybeToJsonValue (" + toJsonValueFunction(type_.type_) + ")";
    case "Result":
      return (
        "resultToJsonValue (" +
        toJsonValueFunction(type_.resultType.ok) +
        ") (" +
        toJsonValueFunction(type_.resultType.error) +
        ")"
      );
    case "Id":
    case "Token":
    case "Custom":
      return customOrIdOrTokenTypeNameToToJsonValueFunctionName(type_.string_);
  }
};

const maybeJsonDecoder = `
maybeJsonDecoder : Jd.Decoder a -> Jd.Decoder (Maybe a)
maybeJsonDecoder decoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\\ tag ->
                case tag of
                    "Just" ->
                        Jd.field "value" decoder |> Jd.map Just

                    "Nothing" ->
                        Jd.succeed Nothing

                    _ ->
                        Jd.fail "maybeのtagの指定が間違っていた"
            )
`;

const resultJsonDecoder = `
resultJsonDecoder : Jd.Decoder ok -> Jd.Decoder error -> Jd.Decoder (Result error ok)
resultJsonDecoder okDecoder errorDecoder =
    Jd.field "_" Jd.string
        |> Jd.andThen
            (\\ tag ->
                case tag of
                    "Ok" ->
                        Jd.field "ok" okDecoder |> Jd.map Ok

                    "Error" ->
                        Jd.field "error" errorDecoder |> Jd.map Err

                    _ ->
                        Jd.fail "resultのtagの指定が間違っていた"
            )
`;

const idOrTokenToJsonDecoderCode = (idOrTokenTypeName: string): string => {
  return (
    customOrIdOrTokenTypeNameToJsonDecoderFunctionName(idOrTokenTypeName) +
    " : Jd.Decoder " +
    idOrTokenTypeName +
    "\n" +
    customOrIdOrTokenTypeNameToJsonDecoderFunctionName(idOrTokenTypeName) +
    " =\n" +
    indentString +
    "Jd.map " +
    idOrTokenTypeName +
    " Jd.string"
  );
};

const typeToDecoder = (type_: type.Type): string => {
  switch (type_._) {
    case "UInt32":
      return "Jd.int";
    case "String":
      return "Jd.string";
    case "Bool":
      return "Jd.bool";
    case "DateTime":
      return '"DateTimeは未サポート"';
    case "List":
      return "(Jd.list " + typeToDecoder(type_.type_) + ")";
    case "Maybe":
      return "(maybeToJsonValue " + typeToDecoder(type_.type_) + ")";
    case "Result":
      return (
        "(resultToJsonValue " +
        typeToDecoder(type_.resultType.ok) +
        " " +
        typeToDecoder(type_.resultType.error) +
        ")"
      );
    case "Id":
    case "Token":
    case "Custom":
      return customOrIdOrTokenTypeNameToJsonDecoderFunctionName(type_.string_);
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

const customOrIdOrTokenTypeNameToToJsonValueFunctionName = (
  name: string
): string => c.firstLowerCase(name) + "ToJsonValue";

const customOrIdOrTokenTypeNameToJsonDecoderFunctionName = (
  name: string
): string => c.firstLowerCase(name) + "JsonDecoder";

const indentString = "    ";
