import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import { Type, Maybe, CustomTypeDefinitionBody } from "../type";
import * as util from "./util";
import * as c from "../case";

export const generateTypeDefinition = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>,
  idOrTokenTypeNameSet: type.IdAndTokenNameSet,
  widthKernel: boolean
): ReadonlyArray<ts.TypeAlias> => {
  if (widthKernel) {
    return [
      codecTypeDefinition(),
      customTypeToDefinition(maybeCustomTypeDefinition),
      customTypeToDefinition(resultCustomTypeDefinition),
      ...customTypeList.map(customTypeToDefinition),
      ...[...idOrTokenTypeNameSet.id, ...idOrTokenTypeNameSet.token].map(
        idOrTokenDefinition
      ),
    ];
  }
  return [
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
export const maybeTsType = (
  elementType: ts.Type,
  widthKernel: boolean
): ts.Type =>
  widthKernel
    ? ts.typeWithParameter(
        ts.typeScopeInFile(identifer.fromString(maybeName)),
        [elementType]
      )
    : ts.typeWithParameter(
        ts.typeImported(util.moduleName, identifer.fromString(maybeName)),
        [elementType]
      );

export const maybeCustomTypeDefinition: type.CustomTypeDefinition = {
  name: maybeName,
  typeParameterList: ["value"],
  description:
    "Maybe. nullableのようなもの. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  body: CustomTypeDefinitionBody.Sum([
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
export const resultTsType = (
  okType: ts.Type,
  errorType: ts.Type,
  withKernel: boolean
): ts.Type =>
  withKernel
    ? ts.typeWithParameter(
        ts.typeScopeInFile(identifer.fromString(resultName)),
        [okType, errorType]
      )
    : ts.typeWithParameter(
        ts.typeImported(util.moduleName, identifer.fromString(resultName)),
        [okType, errorType]
      );

export const resultCustomTypeDefinition: type.CustomTypeDefinition = {
  name: resultName,
  description:
    "成功と失敗を表す型. Elmに標準で定義されているものに変換をするためにデフォルトで用意した",
  typeParameterList: ["ok", "error"],
  body: CustomTypeDefinitionBody.Sum([
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
  body: type.CustomTypeDefinitionBody
): ts.Type => {
  switch (body._) {
    case "Sum":
      if (type.isTagTypeAllNoParameter(body.patternList)) {
        return ts.typeUnion(
          body.patternList.map((pattern) => ts.typeStringLiteral(pattern.name))
        );
      }
      return ts.typeUnion(
        body.patternList.map((pattern) => patternListToObjectType(pattern))
      );
    case "Product":
      return ts.typeObject(
        new Map(
          body.memberList.map((member) => [
            member.name,
            {
              type_: util.typeToTypeScriptType(member.type),
              document: member.description,
            },
          ])
        )
      );
  }
};

const patternListToObjectType = (patternList: type.Pattern): ts.Type => {
  const tagField: [string, { type_: ts.Type; document: string }] = [
    "_",
    {
      document: "",
      type_: ts.typeStringLiteral(patternList.name),
    },
  ];

  switch (patternList.parameter._) {
    case "Just":
      return ts.typeObject(
        new Map([
          tagField,
          [
            util.typeToMemberOrParameterName(patternList.parameter.value),
            {
              document: "",
              type_: util.typeToTypeScriptType(patternList.parameter.value),
            },
          ],
        ])
      );
    case "Nothing":
      return ts.typeObject(new Map([tagField]));
  }
};

/** `@narumincho/type`の型`Codec<type_>`か `Codec<type_>` を表す */
export const codecType = (type_: ts.Type, withKernel: boolean): ts.Type =>
  ts.typeWithParameter(
    withKernel
      ? ts.typeScopeInFile(identifer.fromString("Codec"))
      : ts.typeImported("@narumincho/type", identifer.fromString("Codec")),
    [type_]
  );

const codecName = identifer.fromString("Codec");

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
