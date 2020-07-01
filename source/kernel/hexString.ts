import * as codec from "./codec";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

const type = ts.typeString;

const hexEncodeDefinition = (byteSize: number): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);
  const iName = identifer.fromString("i");
  const iVar = ts.Expr.Variable(iName);

  return codec.encodeLambda(type, (value) => [
    ts.statementVariableDefinition(
      resultName,
      tsUtil.arrayType(ts.Type.Number),
      ts.Expr.ArrayLiteral([])
    ),
    ts.statementFor(iName, ts.Expr.NumberLiteral(byteSize), [
      ts.statementSet(
        ts.Expr.Get({ expr: resultVar, propertyExpr: iVar }),
        null,
        tsUtil.callNumberMethod("parseInt", [
          tsUtil.callMethod(value, "slice", [
            tsUtil.multiplication(iVar, ts.Expr.NumberLiteral(2)),
            tsUtil.addition(
              tsUtil.multiplication(iVar, ts.Expr.NumberLiteral(2)),
              ts.Expr.NumberLiteral(2)
            ),
          ]),
          ts.Expr.NumberLiteral(16),
        ])
      ),
    ]),
    ts.Statement.Return(resultVar),
  ]);
};

const decodeDefinition = (byteSize: number): ts.Expr => {
  return codec.decodeLambda(type, (parameterIndex, parameterBinary) => [
    codec.returnStatement(
      ts.callMethod(
        ts.callMethod(
          ts.Expr.ArrayLiteral([
            {
              expr: ts.callMethod(parameterBinary, "slice", [
                parameterIndex,
                ts.addition(parameterIndex, ts.Expr.NumberLiteral(byteSize)),
              ]),
              spread: true,
            },
          ]),
          "map",
          [
            ts.lambda(
              [
                {
                  name: identifer.fromString("n"),
                  type: ts.Type.Number,
                },
              ],
              [],
              ts.typeString,
              [
                ts.Statement.Return(
                  ts.callMethod(
                    ts.callMethod(
                      ts.Expr.Variable(identifer.fromString("n")),
                      "toString",
                      [ts.Expr.NumberLiteral(16)]
                    ),
                    "padStart",
                    [ts.Expr.NumberLiteral(2), ts.stringLiteral("0")]
                  )
                ),
              ]
            ),
          ]
        ),
        "join",
        [ts.stringLiteral("")]
      ),

      ts.addition(parameterIndex, ts.Expr.NumberLiteral(byteSize))
    ),
  ]);
};

const variableDefinition = (
  byteSize: number,
  name: identifer.Identifer
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
  parameterList: [],
  type: ts.typeIntersection(
    ts.typeString,
    ts.typeObject(
      new Map([
        [
          "_" + util.firstLowerCase(name),
          { required: true, type: ts.typeNever, document: "" },
        ],
      ])
    )
  ),
});

export const idVariableDefinition = (name: string): ts.Variable => {
  const targetType = ts.Type.ScopeInFile(identifer.fromString(name));
  const idCodec = ts.get(ts.Expr.Variable(idName), util.codecPropertyName);
  return {
    name: identifer.fromString(name),
    document: name,
    type: ts.typeObject(
      new Map([
        [
          util.codecPropertyName,
          {
            required: true,
            type: codec.codecType(targetType),
            document: "バイナリに変換する",
          },
        ],
      ])
    ),
    expr: ts.Expr.ObjectLiteral([
      ts.Member.KeyValue(
        util.codecPropertyName,
        ts.Expr.ObjectLiteral([
          ts.Member.KeyValue(
            util.encodePropertyName,
            ts.get(idCodec, util.encodePropertyName)
          ),
          ts.Member.KeyValue(
            util.decodePropertyName,
            ts.typeAssertion(
              ts.get(idCodec, util.decodePropertyName),
              codec.decodeFunctionType(targetType)
            )
          ),
        ])
      ),
    ]),
  };
};

export const tokenVariableDefinition = (name: string): ts.Variable => {
  const targetType = ts.Type.ScopeInFile(identifer.fromString(name));
  const tokenCodec = ts.get(
    ts.Expr.Variable(tokenName),
    util.codecPropertyName
  );
  return {
    name: identifer.fromString(name),
    document: name,
    type: ts.typeObject(
      new Map([
        [
          util.codecPropertyName,
          {
            required: true,
            type: codec.codecType(targetType),
            document: "バイナリに変換する",
          },
        ],
      ])
    ),
    expr: ts.Expr.ObjectLiteral([
      ts.Member.KeyValue(
        util.codecPropertyName,
        ts.Expr.ObjectLiteral([
          ts.Member.KeyValue(
            util.encodePropertyName,
            ts.get(tokenCodec, util.encodePropertyName)
          ),
          ts.Member.KeyValue(
            util.decodePropertyName,
            ts.typeAssertion(
              ts.get(tokenCodec, util.decodePropertyName),
              codec.decodeFunctionType(targetType)
            )
          ),
        ])
      ),
    ]),
  };
};
