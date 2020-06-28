import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const codecTypeWithTypeParameter = (
  type_: ts.Type,
  typeParameterList: ReadonlyArray<string>
): ts.Type => {
  return typeParameterList.length === 0
    ? codecType(type_)
    : ts.typeFunction(
        typeParameterList.map(identifer.fromString),
        typeParameterList.map((typeParameter) =>
          codecType(ts.typeScopeInFile(identifer.fromString(typeParameter)))
        ),
        codecType(
          ts.typeWithParameter(
            type_,
            typeParameterList.map((typeParameter) =>
              ts.typeScopeInFile(identifer.fromString(typeParameter))
            )
          )
        )
      );
};

const codecName = identifer.fromString("Codec");

/** `Codec<type_>` を表す */
export const codecType = (type_: ts.Type): ts.Type =>
  ts.typeWithParameter(ts.typeScopeInFile(codecName), [type_]);

export const codecTypeDefinition = (): ts.TypeAlias => {
  const typeParameterIdentifer = identifer.fromString("T");
  return {
    name: codecName,
    document: "バイナリと相互変換するための関数",
    parameterList: [typeParameterIdentifer],
    type: ts.typeObject(
      new Map([
        [
          util.encodePropertyName,
          {
            required: true,
            type: encodeFunctionType(
              ts.typeScopeInFile(typeParameterIdentifer)
            ),
            document: "",
          },
        ],
        [
          util.decodePropertyName,
          {
            required: true,
            type: decodeFunctionType(
              ts.typeScopeInFile(typeParameterIdentifer)
            ),
            document: "",
          },
        ],
      ])
    ),
  };
};

export const variableDefinition = (
  name: identifer.Identifer,
  type_: ts.Type,
  document: string,
  codecDocument: string,
  encodeDefinition: ts.Expr,
  decodeDefinition: ts.Expr
): ts.Variable => ({
  name,
  document,
  type: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          required: true,
          type: codecType(type_),
          document: codecDocument,
        },
      ],
    ])
  ),
  expr: ts.objectLiteral([
    ts.memberKeyValue(
      util.codecPropertyName,
      ts.objectLiteral([
        ts.memberKeyValue(util.encodePropertyName, encodeDefinition),
        ts.memberKeyValue(util.decodePropertyName, decodeDefinition),
      ])
    ),
  ]),
});

/**
 * ```ts
 * (a: type_) => Readonly<number>
 * ```
 */
export const encodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction([], [type_], encodeReturnType);

export const encodeLambda = (
  type_: ts.Type,
  statementList: (valueExpr: ts.Expr) => ReadonlyArray<ts.Statement>
): ts.Expr => {
  const valueName = identifer.fromString("value");
  return ts.lambda(
    [
      {
        name: valueName,
        type: type_,
      },
    ],
    [],
    encodeReturnType,
    statementList(ts.variable(valueName))
  );
};

const encodeReturnType = ts.readonlyArrayType(ts.typeNumber);
/**
 * ```ts
 * (a: number, b: Uint8Array) => { readonly result: type_, readonly nextIndex: number }
 * ```
 */
export const decodeFunctionType = (type_: ts.Type): ts.Type =>
  ts.typeFunction(
    [],
    decodeParameterList.map((parameter) => parameter.type),
    decodeReturnType(type_)
  );

export const decodeReturnType = (type_: ts.Type): ts.Type =>
  ts.typeObject(
    new Map([
      [
        util.resultProperty,
        {
          required: true,
          type: type_,
          document: "",
        },
      ],
      [
        util.nextIndexProperty,
        { required: true, type: ts.typeNumber, document: "" },
      ],
    ])
  );

const indexIdentifer = identifer.fromString("index");
const binaryIdentifer = identifer.fromString("binary");

/**
 * ( index: number, binary: Uint8Array )
 */
const decodeParameterList: ReadonlyArray<ts.ParameterWithDocument> = [
  {
    name: indexIdentifer,
    type: ts.typeNumber,
    document: "バイナリを読み込み開始位置",
  },
  {
    name: binaryIdentifer,
    type: ts.uint8ArrayType,
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

export const decodeLambda = (
  type: ts.Type,
  statementList: (
    parameterIndex: ts.Expr,
    parameterBinary: ts.Expr
  ) => ReadonlyArray<ts.Statement>
): ts.Expr => {
  return ts.lambda(
    decodeParameterList,
    [],
    decodeReturnType(type),
    statementList(ts.variable(indexIdentifer), ts.variable(binaryIdentifer))
  );
};

/**
 * ```ts
 * expr.result
 * ```
 */
export const getResult = (resultAndNextIndexExpr: ts.Expr): ts.Expr =>
  ts.get(resultAndNextIndexExpr, util.resultProperty);

/**
 * ```ts
 * expr.nextIndex
 * ```
 */
export const getNextIndex = (resultAndNextIndexExpr: ts.Expr): ts.Expr =>
  ts.get(resultAndNextIndexExpr, util.nextIndexProperty);
