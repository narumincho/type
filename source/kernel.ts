import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "./util";

const int32Name = identifer.fromString("Int32");

export const int32Type = (withKernel: boolean): ts.Type =>
  withKernel
    ? ts.typeScopeInFile(int32Name)
    : ts.typeImported(util.moduleName, int32Name);

export const int32Codec = (withKernel: boolean): ts.Expr =>
  ts.get(
    withKernel
      ? ts.variable(int32Name)
      : ts.importedVariable(util.moduleName, int32Name),
    util.codecPropertyName
  );

export const int32ExprDefinition = (): ts.Variable => ({
  name: int32Name,
  document:
    "-2 147 483 648 ～ 2 147 483 647. 32bit 符号付き整数. JavaScriptのnumberで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: codecType(ts.typeNumber, true),
          document:
            "numberの32bit符号あり整数をSigned Leb128のバイナリに変換する",
        },
      ],
    ])
  ),
  expr: ts.objectLiteral([
    ts.memberKeyValue(
      util.codecPropertyName,
      ts.objectLiteral([
        ts.memberKeyValue(util.encodePropertyName, int32EncodeDefinition()),
        ts.memberKeyValue(util.decodePropertyName, int32DecodeDefinition()),
      ])
    ),
  ]),
});

/**
 * numberの32bit符号あり整数をSigned Leb128のバイナリに変換するコード
 */
const int32EncodeDefinition = (): ts.Expr => {
  const valueName = identifer.fromString("value");
  const valueVar = ts.variable(valueName);
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.variable(byteName);

  return ts.lambda(
    [
      {
        name: valueName,
        type_: ts.typeNumber,
      },
    ],
    [],
    encodeReturnType,
    [
      ts.statementSet(valueVar, "|", ts.numberLiteral(0)),
      ts.statementVariableDefinition(
        resultName,
        ts.arrayType(ts.typeNumber),
        ts.arrayLiteral([])
      ),
      ts.statementWhileTrue([
        ts.statementVariableDefinition(
          byteName,
          ts.typeNumber,
          ts.bitwiseAnd(valueVar, ts.numberLiteral(0x7f))
        ),
        ts.statementSet(valueVar, ">>", ts.numberLiteral(7)),
        ts.statementIf(
          ts.logicalOr(
            ts.logicalAnd(
              ts.equal(valueVar, ts.numberLiteral(0)),
              ts.equal(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            ),
            ts.logicalAnd(
              ts.equal(valueVar, ts.numberLiteral(-1)),
              ts.notEqual(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            )
          ),
          [
            ts.statementEvaluateExpr(
              ts.callMethod(resultVar, "push", [byteVar])
            ),
            ts.statementReturn(resultVar),
          ]
        ),
        ts.statementEvaluateExpr(
          ts.callMethod(resultVar, "push", [
            ts.bitwiseOr(byteVar, ts.numberLiteral(0x80)),
          ])
        ),
      ]),
    ]
  );
};

export const int32DecodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const offsetName = identifer.fromString("offset");
  const offsetVar = ts.variable(offsetName);
  const byteName = identifer.fromString("byte");
  const byteVar = ts.variable(byteName);

  return ts.lambda(decodeParameterList, [], decodeReturnType(ts.typeNumber), [
    ts.statementLetVariableDefinition(
      resultName,
      ts.typeNumber,
      ts.numberLiteral(0)
    ),
    ts.statementLetVariableDefinition(
      offsetName,
      ts.typeNumber,
      ts.numberLiteral(0)
    ),
    ts.statementWhileTrue([
      ts.statementVariableDefinition(
        byteName,
        ts.typeNumber,
        ts.getByExpr(parameterBinary, ts.addition(parameterIndex, offsetVar))
      ),
      ts.statementSet(
        resultVar,
        "|",
        ts.leftShift(
          ts.bitwiseAnd(byteVar, ts.numberLiteral(0x7f)),
          ts.multiplication(offsetVar, ts.numberLiteral(7))
        )
      ),
      ts.statementSet(offsetVar, "+", ts.numberLiteral(1)),
      ts.statementIf(
        ts.equal(
          ts.bitwiseAnd(ts.numberLiteral(0x80), byteVar),
          ts.numberLiteral(0)
        ),
        [
          ts.statementIf(
            ts.logicalAnd(
              ts.lessThan(
                ts.multiplication(offsetVar, ts.numberLiteral(7)),
                ts.numberLiteral(32)
              ),
              ts.notEqual(
                ts.bitwiseAnd(byteVar, ts.numberLiteral(0x40)),
                ts.numberLiteral(0)
              )
            ),
            [
              returnStatement(
                ts.bitwiseOr(
                  resultVar,
                  ts.leftShift(
                    ts.bitwiseNot(ts.numberLiteral(0)),
                    ts.multiplication(offsetVar, ts.numberLiteral(7))
                  )
                ),
                ts.addition(parameterIndex, offsetVar)
              ),
            ]
          ),
          returnStatement(resultVar, ts.addition(parameterIndex, offsetVar)),
        ]
      ),
    ]),
  ]);
};

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
        "result",
        {
          type_: type_,
          document: "",
        },
      ],
      ["nextIndex", { type_: ts.typeNumber, document: "" }],
    ])
  );

const indexIdentifer = identifer.fromString("index");
const binaryIdentifer = identifer.fromString("binary");
const parameterIndex = ts.variable(indexIdentifer);
const parameterBinary = ts.variable(binaryIdentifer);
/**
 * ( index: number, binary: Uint8Array )
 */
const decodeParameterList: ReadonlyArray<ts.ParameterWithDocument> = [
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
const returnStatement = (
  resultExpr: ts.Expr,
  nextIndexExpr: ts.Expr
): ts.Statement =>
  ts.statementReturn(
    ts.objectLiteral([
      ts.memberKeyValue(util.resultProperty, resultExpr),
      ts.memberKeyValue(util.nextIndexProperty, nextIndexExpr),
    ])
  );
