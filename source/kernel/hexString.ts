import * as codec from "./codec";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

const type = ts.typeString;

const hexEncodeDefinition = (byteSize: number): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);
  const iName = identifer.fromString("i");
  const iVar = ts.variable(iName);

  return codec.encodeLambda(type, (value) => [
    ts.statementVariableDefinition(
      resultName,
      ts.arrayType(ts.typeNumber),
      ts.arrayLiteral([])
    ),
    ts.statementFor(iName, ts.numberLiteral(byteSize), [
      ts.statementSet(
        ts.getByExpr(resultVar, iVar),
        null,
        ts.callNumberMethod("parseInt", [
          ts.callMethod(value, "slice", [
            ts.multiplication(iVar, ts.numberLiteral(2)),
            ts.addition(
              ts.multiplication(iVar, ts.numberLiteral(2)),
              ts.numberLiteral(2)
            ),
          ]),
          ts.numberLiteral(16),
        ])
      ),
    ]),
    ts.statementReturn(resultVar),
  ]);
};

const decodeDefinition = (byteSize: number): ts.Expr => {
  return codec.decodeLambda(type, (parameterIndex, parameterBinary) => [
    codec.returnStatement(
      ts.callMethod(
        ts.callMethod(
          ts.arrayLiteral([
            {
              expr: ts.callMethod(parameterBinary, "slice", [
                parameterIndex,
                ts.addition(parameterIndex, ts.numberLiteral(byteSize)),
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
                  type: ts.typeNumber,
                },
              ],
              [],
              ts.typeString,
              [
                ts.statementReturn(
                  ts.callMethod(
                    ts.callMethod(
                      ts.variable(identifer.fromString("n")),
                      "toString",
                      [ts.numberLiteral(16)]
                    ),
                    "padStart",
                    [ts.numberLiteral(2), ts.stringLiteral("0")]
                  )
                ),
              ]
            ),
          ]
        ),
        "join",
        [ts.stringLiteral("")]
      ),

      ts.addition(parameterIndex, ts.numberLiteral(byteSize))
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
  const targetType = ts.typeScopeInFile(identifer.fromString(name));
  const idCodec = ts.get(ts.variable(idName), util.codecPropertyName);
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
    expr: ts.objectLiteral([
      ts.memberKeyValue(
        util.codecPropertyName,
        ts.objectLiteral([
          ts.memberKeyValue(
            util.encodePropertyName,
            ts.get(idCodec, util.encodePropertyName)
          ),
          ts.memberKeyValue(
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
  const targetType = ts.typeScopeInFile(identifer.fromString(name));
  const tokenCodec = ts.get(ts.variable(tokenName), util.codecPropertyName);
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
    expr: ts.objectLiteral([
      ts.memberKeyValue(
        util.codecPropertyName,
        ts.objectLiteral([
          ts.memberKeyValue(
            util.encodePropertyName,
            ts.get(tokenCodec, util.encodePropertyName)
          ),
          ts.memberKeyValue(
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
