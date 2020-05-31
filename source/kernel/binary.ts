import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";
import * as int32 from "./int32";

export const name = identifer.fromString("Binary");

export const type: ts.Type = ts.uint8ArrayType;

export const codec = (withKernel: boolean): ts.Expr =>
  ts.get(
    withKernel ? ts.variable(name) : ts.importedVariable(util.moduleName, name),
    util.codecPropertyName
  );

export const exprDefinition = (): ts.Variable => ({
  name: name,
  document: "バイナリ. JavaScriptのUint8Arrayで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: c.codecType(type, true),
          document: "最初にバイト数, その次にバイナリそのまま",
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
  const valueName = identifer.fromString("value");
  const valueVar = ts.variable(valueName);
  return ts.lambda(
    [
      {
        name: valueName,
        type_: type,
      },
    ],
    [],
    c.encodeReturnType,
    [
      ts.statementReturn(
        ts.callMethod(
          int32.encode(true, ts.get(valueVar, "length")),
          "concat",
          [ts.arrayLiteral([{ expr: valueVar, spread: true }])]
        )
      ),
    ]
  );
};
const decodeDefinition = (): ts.Expr => {
  const lengthName = identifer.fromString("length");
  const lengthVar = ts.variable(lengthName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.variable(nextIndexName);

  return ts.lambda(c.decodeParameterList, [], c.decodeReturnType(type), [
    ts.statementVariableDefinition(
      lengthName,
      c.decodeReturnType(ts.typeNumber),
      int32.decode(true, c.parameterIndex, c.parameterBinary)
    ),
    ts.statementVariableDefinition(
      nextIndexName,
      ts.typeNumber,
      ts.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar))
    ),
    c.returnStatement(
      ts.callMethod(c.parameterBinary, "slice", [
        c.getNextIndex(lengthVar),
        nextIndexVar,
      ]),
      nextIndexVar
    ),
  ]);
};
