import * as codec from "./codec";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

const type = ts.Type.String;

const hexEncodeDefinition = (byteSize: number): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);
  const iName = identifer.fromString("i");
  const iVar = ts.Expr.Variable(iName);

  return codec.encodeLambda(type, (value) => [
    ts.Statement.VariableDefinition({
      isConst: true,
      name: resultName,
      type: tsUtil.arrayType(ts.Type.Number),
      expr: ts.Expr.ArrayLiteral([]),
    }),
    ts.Statement.For({
      counterVariableName: iName,
      untilExpr: ts.Expr.NumberLiteral(byteSize),
      statementList: [
        ts.Statement.Set({
          target: ts.Expr.Get({ expr: resultVar, propertyExpr: iVar }),
          operatorMaybe: ts.Maybe.Nothing(),
          expr: tsUtil.callNumberMethod("parseInt", [
            tsUtil.callMethod(value, "slice", [
              tsUtil.multiplication(iVar, ts.Expr.NumberLiteral(2)),
              tsUtil.addition(
                tsUtil.multiplication(iVar, ts.Expr.NumberLiteral(2)),
                ts.Expr.NumberLiteral(2)
              ),
            ]),
            ts.Expr.NumberLiteral(16),
          ]),
        }),
      ],
    }),
    ts.Statement.Return(resultVar),
  ]);
};

const decodeDefinition = (byteSize: number): ts.Expr => {
  return codec.decodeLambda(type, (parameterIndex, parameterBinary) => [
    codec.returnStatement(
      tsUtil.callMethod(
        tsUtil.callMethod(
          ts.Expr.ArrayLiteral([
            {
              expr: tsUtil.callMethod(parameterBinary, "slice", [
                parameterIndex,
                tsUtil.addition(
                  parameterIndex,
                  ts.Expr.NumberLiteral(byteSize)
                ),
              ]),
              spread: true,
            },
          ]),
          "map",
          [
            ts.Expr.Lambda({
              typeParameterList: [],
              parameterList: [
                {
                  name: identifer.fromString("n"),
                  type: ts.Type.Number,
                },
              ],
              returnType: ts.Type.String,
              statementList: [
                ts.Statement.Return(
                  tsUtil.callMethod(
                    tsUtil.callMethod(
                      ts.Expr.Variable(identifer.fromString("n")),
                      "toString",
                      [ts.Expr.NumberLiteral(16)]
                    ),
                    "padStart",
                    [ts.Expr.NumberLiteral(2), ts.Expr.StringLiteral("0")]
                  )
                ),
              ],
            }),
          ]
        ),
        "join",
        [ts.Expr.StringLiteral("")]
      ),

      tsUtil.addition(parameterIndex, ts.Expr.NumberLiteral(byteSize))
    ),
  ]);
};

const variableDefinition = (
  byteSize: number,
  name: ts.Identifer
): ts.Variable =>
  codec.variableDefinition(
    name,
    type,
    byteSize.toString() +
      "byteのバイナリ. JSでは 0-fの16進数の文字列として扱う",
    "",
    hexEncodeDefinition(byteSize),
    decodeDefinition(byteSize)
  );

const idName = identifer.fromString("Id");
const tokenName = identifer.fromString("Token");
export const idKernelExprDefinition = variableDefinition(16, idName);
export const tokenKernelExprDefinition = variableDefinition(32, tokenName);

export const typeDefinition = (name: string): ts.TypeAlias => ({
  name: identifer.fromString(name),
  document: "",
  typeParameterList: [],
  type: ts.Type.Intersection({
    left: ts.Type.String,
    right: ts.Type.Object([
      {
        name: "_" + util.firstLowerCase(name),
        required: true,
        type: ts.Type.Never,
        document: "",
      },
    ]),
  }),
});

export const idVariableDefinition = (name: string): ts.Variable => {
  const targetType = ts.Type.ScopeInFile(identifer.fromString(name));
  const idCodec = tsUtil.get(ts.Expr.Variable(idName), util.codecPropertyName);
  return {
    name: identifer.fromString(name),
    document: name,
    type: ts.Type.Object([
      {
        name: util.codecPropertyName,
        required: true,
        type: codec.codecType(targetType),
        document: "バイナリに変換する",
      },
    ]),
    expr: ts.Expr.ObjectLiteral([
      ts.Member.KeyValue({
        key: util.codecPropertyName,
        value: ts.Expr.ObjectLiteral([
          ts.Member.KeyValue({
            key: util.encodePropertyName,
            value: tsUtil.get(idCodec, util.encodePropertyName),
          }),
          ts.Member.KeyValue({
            key: util.decodePropertyName,
            value: ts.Expr.TypeAssertion({
              expr: tsUtil.get(idCodec, util.decodePropertyName),
              type: codec.decodeFunctionType(targetType),
            }),
          }),
        ]),
      }),
    ]),
  };
};

export const tokenVariableDefinition = (name: string): ts.Variable => {
  const targetType = ts.Type.ScopeInFile(identifer.fromString(name));
  const tokenCodec = tsUtil.get(
    ts.Expr.Variable(tokenName),
    util.codecPropertyName
  );
  return {
    name: identifer.fromString(name),
    document: name,
    type: ts.Type.Object([
      {
        name: util.codecPropertyName,
        required: true,
        type: codec.codecType(targetType),
        document: "バイナリに変換する",
      },
    ]),
    expr: ts.Expr.ObjectLiteral([
      ts.Member.KeyValue({
        key: util.codecPropertyName,
        value: ts.Expr.ObjectLiteral([
          ts.Member.KeyValue({
            key: util.encodePropertyName,
            value: tsUtil.get(tokenCodec, util.encodePropertyName),
          }),
          ts.Member.KeyValue({
            key: util.decodePropertyName,

            value: ts.Expr.TypeAssertion({
              expr: tsUtil.get(tokenCodec, util.decodePropertyName),
              type: codec.decodeFunctionType(targetType),
            }),
          }),
        ]),
      }),
    ]),
  };
};
