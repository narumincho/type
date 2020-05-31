import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";

const name = identifer.fromString("Bool");

export const type = (withKernel: boolean): ts.Type =>
  withKernel
    ? ts.typeScopeInFile(name)
    : ts.typeImported(util.moduleName, name);

export const codec = (withKernel: boolean): ts.Expr =>
  ts.get(
    withKernel ? ts.variable(name) : ts.importedVariable(util.moduleName, name),
    util.codecPropertyName
  );

export const exprDefinition = (): ts.Variable => ({
  name: name,
  document: "Bool. 真か偽. JavaScriptのbooleanで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: c.codecType(ts.typeBoolean, true),
          document: "true: 1, false: 0. (1byte)としてバイナリ保存する",
        },
      ],
    ])
  ),
  expr: ts.objectLiteral([
    ts.memberKeyValue(
      util.codecPropertyName,
      ts.objectLiteral([
        ts.memberKeyValue(util.encodePropertyName, encodeDefinition()),
        ts.memberKeyValue(util.decodePropertyName, decodeDefinition()),
      ])
    ),
  ]),
});

const encodeDefinition = (): ts.Expr => {
  return ts.lambda(
    [
      {
        name: identifer.fromString("value"),
        type_: ts.typeBoolean,
      },
    ],
    [],
    c.encodeReturnType,
    [
      ts.statementReturn(
        ts.arrayLiteral([
          {
            expr: ts.conditionalOperator(
              ts.variable(identifer.fromString("value")),
              ts.numberLiteral(1),
              ts.numberLiteral(0)
            ),
            spread: false,
          },
        ])
      ),
    ]
  );
};

const decodeDefinition = (): ts.Expr => {
  return ts.lambda(
    c.decodeParameterList,
    [],
    c.decodeReturnType(ts.typeBoolean),
    [
      c.returnStatement(
        ts.notEqual(
          ts.getByExpr(c.parameterBinary, c.parameterIndex),
          ts.numberLiteral(0)
        ),
        ts.addition(c.parameterIndex, ts.numberLiteral(1))
      ),
    ]
  );
};
