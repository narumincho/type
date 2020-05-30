import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";

export const codecTypeWithTypeParameter = (
  type_: ts.Type,
  typeParameterList: ReadonlyArray<string>,
  withKernel: boolean
): ts.Type => {
  return typeParameterList.length === 0
    ? codecType(type_, withKernel)
    : ts.typeFunction(
        typeParameterList.map(identifer.fromString),
        typeParameterList.map((typeParameter) =>
          codecType(
            ts.typeScopeInFile(identifer.fromString(typeParameter)),
            withKernel
          )
        ),
        codecType(
          ts.typeWithParameter(
            type_,
            typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          ),
          withKernel
        )
      );
};

const codecName = identifer.fromString("Codec");

/** `@narumincho/type`の型`Codec<type_>`か `Codec<type_>` を表す */
export const codecType = (type_: ts.Type, withKernel: boolean): ts.Type =>
  ts.typeWithParameter(
    withKernel
      ? ts.typeScopeInFile(codecName)
      : ts.typeImported(util.moduleName, codecName),
    [type_]
  );

export const codecTypeDefinition = (): ts.TypeAlias => {
  const typeParameterIdentifer = identifer.fromString("T");
  return {
    name: codecName,
    document: "バイナリと相互変換するための関数",
    parameterList: [typeParameterIdentifer],
    type_: ts.typeObject(
      new Map([
        [
          util.encodePropertyName,
          {
            type_: encodeFunctionType(
              ts.typeScopeInFile(typeParameterIdentifer)
            ),
            document: "",
          },
        ],
        [
          util.decodePropertyName,
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
  ts.typeFunction([], [type_], encodeReturnType);

export const encodeReturnType = ts.readonlyArrayType(ts.typeNumber);
/**
 * ```ts
 * (a: number, b: Uint8Array) => { readonly result: type_, readonly nextIndex: number }
 * ```
 */
export const decodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction(
    [],
    decodeParameterList.map((parameter) => parameter.type_),
    decodeReturnType(type_)
  );

export const decodeReturnType = (type_: ts.Type): ts.Type =>
  ts.typeObject(
    new Map([
      [
        util.resultProperty,
        {
          type_: type_,
          document: "",
        },
      ],
      [util.nextIndexProperty, { type_: ts.typeNumber, document: "" }],
    ])
  );

const indexIdentifer = identifer.fromString("index");
const binaryIdentifer = identifer.fromString("binary");
export const parameterIndex = ts.variable(indexIdentifer);
export const parameterBinary = ts.variable(binaryIdentifer);

/**
 * ( index: number, binary: Uint8Array )
 */
export const decodeParameterList: ReadonlyArray<ts.ParameterWithDocument> = [
  {
    name: indexIdentifer,
    type_: ts.typeNumber,
    document: "バイナリを読み込み開始位置",
  },
  {
    name: binaryIdentifer,
    type_: ts.uint8ArrayType,
    document: "バイナリ",
  },
];

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
export const returnStatement = (
  resultExpr: ts.Expr,
  nextIndexExpr: ts.Expr
): ts.Statement =>
  ts.statementReturn(
    ts.objectLiteral([
      ts.memberKeyValue(util.resultProperty, resultExpr),
      ts.memberKeyValue(util.nextIndexProperty, nextIndexExpr),
    ])
  );
