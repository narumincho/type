import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import { Type, Maybe } from "../type";
import * as util from "./util";
import * as c from "../case";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idOrTokenTypeNameSet: type.IdAndTokenNameSet
): ReadonlyArray<ts.TypeAlias> => {
  return [
    codecTypeDefinition(),
    customTypeToDefinition(maybeCustomTypeDefinition),
    customTypeToDefinition(resultCustomTypeDefinition),
    ...customTypeList.map(customTypeToDefinition),
    ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(
      idOrTokenDefinition
    ),
  ];
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeName = "Maybe";
export const maybeTsType = (elementType: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(identifer.fromString(maybeName)), [
    elementType,
  ]);

export const maybeCustomTypeDefinition: type.CustomTypeDefinition = {
  name: maybeName,
  typeParameterList: ["value"],
  description:
    "Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  body: type.customTypeBodySum([
    {
      name: "Just",
      description: "値があるということ",
      parameter: Maybe.Just(Type.Parameter("value")),
    },
    {
      name: "Nothing",
      description: "値がないということ",
      parameter: Maybe.Nothing(),
    },
  ]),
};

/* ========================================
                  Result
   ========================================
*/

const resultName = "Result";
export const resultTsType = (okType: ts.Type, errorType: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(identifer.fromString(resultName)), [
    okType,
    errorType,
  ]);

export const resultCustomTypeDefinition: type.CustomTypeDefinition = {
  name: resultName,
  description:
    "成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  typeParameterList: ["ok", "error"],
  body: type.customTypeBodySum([
    {
      name: "Ok",
      description: "成功",
      parameter: Maybe.Just(Type.Parameter("ok")),
    },
    {
      name: "Error",
      description: "失敗",
      parameter: Maybe.Just(Type.Parameter("error")),
    },
  ]),
};
/* ========================================
                Id Token
   ========================================
 */

const idOrTokenDefinition = (name: string): ts.TypeAlias => ({
  name: identifer.fromString(name),
  document: "",
  parameterList: [],
  type_: ts.typeIntersection(
    ts.typeString,
    ts.typeObject(
      new Map([
        ["_" + c.firstLowerCase(name), { type_: ts.typeNever, document: "" }],
      ])
    )
  ),
});

/* ========================================
               Custom Type
   ========================================
*/

export const customTypeToDefinition = (
  customType: type.CustomTypeDefinition
): ts.TypeAlias => ({
  name: identifer.fromString(customType.name),
  document: customType.description,
  parameterList: customType.typeParameterList.map(identifer.fromString),
  type_: customTypeDefinitionBodyToTsType(customType.body),
});

const customTypeDefinitionBodyToTsType = (
  body: type.CustomTypeBody
): ts.Type => {
  switch (body._) {
    case "Sum":
      if (type.isTagTypeAllNoParameter(body.tagNameAndParameterList)) {
        return ts.typeUnion(
          body.tagNameAndParameterList.map((tagNameAndParameter) =>
            ts.typeStringLiteral(tagNameAndParameter.name)
          )
        );
      }
      return ts.typeUnion(
        body.tagNameAndParameterList.map((tagNameAndParameter) =>
          tagNameAndParameterToObjectType(tagNameAndParameter)
        )
      );
    case "Product":
      return ts.typeObject(
        new Map(
          body.memberNameAndTypeList.map((memberNameAndType) => [
            memberNameAndType.name,
            {
              type_: util.typeToTypeScriptType(memberNameAndType.memberType),
              document: memberNameAndType.description,
            },
          ])
        )
      );
  }
};

const tagNameAndParameterToObjectType = (
  tagNameAndParameter: type.TagNameAndParameter
): ts.Type => {
  const tagField: [string, { type_: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: ts.typeStringLiteral(tagNameAndParameter.name),
    },
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.typeObject(
        new Map([
          tagField,
          [
            util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            {
              document: "",
              type_: util.typeToTypeScriptType(
                tagNameAndParameter.parameter.value
              ),
            },
          ],
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};

const codecName = identifer.fromString("_Codec");

/** _Codec<type_> の型を表す */
export const codecType = (type_: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(codecName), [type_]);

const codecTypeDefinition = (): ts.TypeAlias => {
  const typeParameterIdentifer = identifer.fromString("T");
  return {
    name: codecName,
    document: "バイナリと相互変換するための関数",
    parameterList: [typeParameterIdentifer],
    type_: ts.typeObject(
      new Map([
        [
          "encode",
          {
            type_: encodeFunctionType(
              ts.typeScopeInFile(typeParameterIdentifer)
            ),
            document: "",
          },
        ],
        [
          "decode",
          {
            type_: decodeFunctionType(
              ts.typeScopeInFile(typeParameterIdentifer)
            ),
            document: "",
          },
        ],
      ])
    ),
  };
};

/**
 * ```ts
 * (a: type_) => Readonly<number>
 * ```
 */
export const encodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction([], [type_], ts.readonlyArrayType(ts.typeNumber));

/**
 * ```ts
 * (a: number, b: Uint8Array) => { readonly result: type_, readonly nextIndex: number }
 * ```
 */
export const decodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction(
    [],
    [ts.typeNumber, ts.uint8ArrayType],
    ts.typeObject(
      new Map([
        [
          "result",
          {
            type_: type_,
            document: "",
          },
        ],
        ["nextIndex", { type_: ts.typeNumber, document: "" }],
      ])
    )
  );
