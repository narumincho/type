import * as type from "./type";
import * as c from "./case";

export const generateCode = (
  moduleName: string,
  customTypeList: ReadonlyArray<type.CustomType>,
  idOrTokenTypeNameSet: Set<string>
): string => {
  const idOrTokenTypeNameList = [...idOrTokenTypeNameSet];
  const notIncludeBinaryCustomTypeList = customTypeList.filter(
    customType => !type.isIncludeBinaryType(customType)
  );
  return [
    moduleExportList(
      moduleName,
      notIncludeBinaryCustomTypeList,
      idOrTokenTypeNameSet
    ),
    importList,
    ...notIncludeBinaryCustomTypeList.map(customTypeToTypeDefinitionCode),
    ...idOrTokenTypeNameList.map(idOrTokenTypeToTypeDefinitionCode),
    maybeToJsonValueCode,
    resultToJsonValueCode,
    ...idOrTokenTypeNameList.map(idOrTokenTypeToToJsonValueCode),
    ...notIncludeBinaryCustomTypeList.map(customTypeToToJsonValueCode),
    maybeJsonDecoder,
    resultJsonDecoder,
    ...idOrTokenTypeNameList.map(idOrTokenToJsonDecoderCode),
    ...notIncludeBinaryCustomTypeList.map(customTypeToJsonDecoder)
  ].join("\n\n");
};

const moduleExportList = (
  moduleName: string,
  customTypeList: ReadonlyArray<type.CustomType>,
  idOrTokenTypeNameSet: Set<string>
): string => {
  return (
    "module " +
    moduleName +
    " exposing (" +
    [
      ...[...idOrTokenTypeNameSet].map(
        idOrTokenTypeName => idOrTokenTypeName + "(..)"
      ),
      ...customTypeList.map(customType => {
        switch (customType.body._) {
          case "Sum":
            return customType.name + "(..)";
          case "Product":
            return customType.name;
        }
      }),
      "maybeToJsonValue",
      "resultToJsonValue",
      ...[...idOrTokenTypeNameSet].map(
        customOrIdOrTokenTypeNameToToJsonValueFunctionName
      ),
      ...customTypeList.map(customType =>
        customOrIdOrTokenTypeNameToToJsonValueFunctionName(customType.name)
      ),
      "maybeJsonDecoder",
      "resultJsonDecoder",
      ...[...idOrTokenTypeNameSet].map(
        customOrIdOrTokenTypeNameToJsonDecoderFunctionName
      ),
      ...customTypeList.map(customType =>
        customOrIdOrTokenTypeNameToJsonDecoderFunctionName(customType.name)
      )
    ].join(", ") +
    ")"
  );
};

const importList = `
import Json.Encode as Je
import Json.Decode as Jd
import Json.Decode.Pipeline as Jdp
`;

const customTypeToTypeDefinitionCode = (
  customType: type.CustomType
): string => {
  switch (customType.body._) {
    case "Sum":
      return (
        commentToCode(customType.description) +
        createType(customType.name, customType.body.tagNameAndParameterList)
      );
    case "Product":
      return (
        commentToCode(customType.description) +
        createTypeAlias(customType.name, customType.body.memberNameAndTypeList)
      );
  }
};

const createType = (
  typeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): string =>
  "type " +
  typeName +
  "\n  = " +
  tagNameAndParameterArray
    .map(tagNameAndParameter => {
      switch (tagNameAndParameter.parameter._) {
        case "Just":
          return (
            createConstructor(typeName, tagNameAndParameter.name) +
            " " +
            typeToElmType(tagNameAndParameter.parameter.value)
          );
        case "Nothing":
          return createConstructor(typeName, tagNameAndParameter.name);
      }
    })
    .join("\n  | ") +
  "\n";

const createConstructor = (customTypeName: string, tagName: string): string =>
  customTypeName + tagName;

const createTypeAlias = (
  typeName: string,
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>
): string => {
  return (
    "type alias " +
    typeName +
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
            Je.object [ ( "_", Je.string "Ok" ), ( "ok", okToJsonValueFunction value ) ]

        Err value ->
            Je.object [ ( "_", Je.string "Error" ), ( "error", errorToJsonValueFunction value ) ]
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

  const header =
    commentToCode(customType.name + "のJSONへのエンコーダ") +
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(customType.name) +
    " : " +
    customType.name +
    " -> Je.Value\n" +
    customOrIdOrTokenTypeNameToToJsonValueFunctionName(customType.name) +
    " " +
    parameterName +
    " =\n";

  switch (customType.body._) {
    case "Sum":
      return (
        header +
        customTypeSumToToJsonValueCodeBody(
          customType.name,
          customType.body.tagNameAndParameterList,
          parameterName
        )
      );
    case "Product":
      return (
        header +
        customTypeProductToToJsonValueCodeBody(
          customType.body.memberNameAndTypeList,
          parameterName
        )
      );
  }
};

const customTypeSumToToJsonValueCodeBody = (
  customTypeName: string,
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
            createConstructor(customTypeName, tagNameAndParameter.name) +
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
      .map(tagNameAndParameter => {
        switch (tagNameAndParameter.parameter._) {
          case "Just": {
            return (
              indentString.repeat(2) +
              createConstructor(customTypeName, tagNameAndParameter.name) +
              " parameter ->\n" +
              indentString.repeat(3) +
              'Je.object [ ( "_", Je.string "' +
              tagNameAndParameter.name +
              '"), ( "' +
              (type.typeToMemberOrParameterName(
                tagNameAndParameter.parameter.value
              ) as string) +
              '", ' +
              toJsonValueVarEval(
                tagNameAndParameter.parameter.value,
                "parameter"
              ) +
              ")" +
              "]"
            );
          }
          case "Nothing":
            return (
              indentString.repeat(2) +
              createConstructor(customTypeName, tagNameAndParameter.name) +
              " ->\n" +
              indentString.repeat(3) +
              'Je.object [ ( "_", Je.string "' +
              tagNameAndParameter.name +
              '") ]'
            );
        }
      })
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
            parameterName +
              "." +
              type.elmIdentiferFromString(memberNameAndType.name)
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
    case "Int32":
      return "Je.int";
    case "String":
      return "Je.string";
    case "Bool":
      return "Je.bool";
    case "Binary":
      return '"@narumincho/type not support binary encode in Elm."';
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

const customTypeToJsonDecoder = (customType: type.CustomType): string => {
  const header =
    commentToCode(customType.name + "のJSON Decoder") +
    customOrIdOrTokenTypeNameToJsonDecoderFunctionName(customType.name) +
    " : Jd.Decoder " +
    customType.name +
    "\n" +
    customOrIdOrTokenTypeNameToJsonDecoderFunctionName(customType.name) +
    " =\n";

  switch (customType.body._) {
    case "Sum":
      return (
        header +
        customTypeSumToJsonDecoderCodeBody(
          customType.name,
          customType.body.tagNameAndParameterList
        )
      );
    case "Product":
      return (
        header +
        customTypeProductToJsonDecoderCodeBody(
          customType.body.memberNameAndTypeList
        )
      );
  }
};

const customTypeSumToJsonDecoderCodeBody = (
  customTypeName: string,
  tagNameAndParameterArray: ReadonlyArray<type.TagNameAndParameter>
): string => {
  const tagToDecoderLambda =
    indentString.repeat(2) +
    "|> Jd.andThen\n" +
    indentString.repeat(3) +
    "(\\tag ->\n" +
    indentString.repeat(4) +
    "case tag of\n" +
    tagNameAndParameterArray
      .map(tagNameAndParameter =>
        tagNameAndParameterToPatternCode(customTypeName, tagNameAndParameter)
      )
      .join("\n") +
    "\n" +
    indentString.repeat(5) +
    "_ ->\n" +
    indentString.repeat(6) +
    'Jd.fail ("' +
    customTypeName +
    'で不明なタグを受けたとった tag=" ++ tag)' +
    "\n" +
    indentString.repeat(3) +
    ")";
  if (type.isProductTypeAllNoParameter(tagNameAndParameterArray)) {
    return indentString + "Jd.string\n" + tagToDecoderLambda;
  }
  return indentString + 'Jd.field "_" Jd.string\n' + tagToDecoderLambda;
};

const tagNameAndParameterToPatternCode = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter
): string => {
  const constructor = createConstructor(
    customTypeName,
    tagNameAndParameter.name
  );
  return (
    indentString.repeat(5) +
    '"' +
    tagNameAndParameter.name +
    '" ->\n' +
    indentString.repeat(6) +
    (tagNameAndParameter.parameter._ === "Just"
      ? 'Jd.field "' +
        (type.typeToMemberOrParameterName(
          tagNameAndParameter.parameter.value
        ) as string) +
        '" ' +
        typeToDecoder(tagNameAndParameter.parameter.value) +
        " |> Jd.map " +
        constructor
      : "Jd.succeed " + constructor)
  );
};

const customTypeProductToJsonDecoderCodeBody = (
  memberNameAndTypeArray: ReadonlyArray<type.MemberNameAndType>
): string => {
  return (
    indentString +
    "Jd.succeed\n" +
    indentString.repeat(2) +
    "(\\" +
    memberNameAndTypeArray
      .map(memberNameAndType =>
        type.elmIdentiferFromString(memberNameAndType.name)
      )
      .join(" ") +
    " ->\n" +
    indentString.repeat(3) +
    "{ " +
    memberNameAndTypeArray
      .map(
        memberNameAndType =>
          type.elmIdentiferFromString(memberNameAndType.name) +
          " = " +
          type.elmIdentiferFromString(memberNameAndType.name)
      )
      .join("\n" + indentString.repeat(3) + ", ") +
    "\n" +
    indentString.repeat(3) +
    "}\n" +
    indentString.repeat(2) +
    ")\n" +
    memberNameAndTypeArray
      .map(
        memberNameAndType =>
          indentString.repeat(2) +
          '|> Jdp.required "' +
          memberNameAndType.name +
          '" ' +
          typeToDecoder(memberNameAndType.memberType)
      )
      .join("\n")
  );
};

const typeToDecoder = (type_: type.Type): string => {
  switch (type_._) {
    case "Int32":
      return "Jd.int";
    case "String":
      return "Jd.string";
    case "Bool":
      return "Jd.bool";
    case "Binary":
      return '"@narumincho/type not support binary decode in Elm."';
    case "List":
      return "(Jd.list " + typeToDecoder(type_.type_) + ")";
    case "Maybe":
      return "(maybeJsonDecoder " + typeToDecoder(type_.type_) + ")";
    case "Result":
      return (
        "(resultJsonDecoder " +
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
    case "Int32":
      return "Int";
    case "String":
      return "String";
    case "Bool":
      return "Bool";
    case "Binary":
      return '"@narumincho/type not support binary type in Elm."';
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
