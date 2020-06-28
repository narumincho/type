import * as c from "./codec";
import * as int32 from "./int32";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const name = identifer.fromString("Binary");

export const type: ts.Type = ts.uint8ArrayType;

export const codec = (): ts.Expr =>
  ts.get(ts.variable(name), util.codecPropertyName);

export const variableDefinition = (): ts.Variable =>
  c.variableDefinition(
    name,
    type,
    "バイナリ. JavaScriptのUint8Arrayで扱える",
    "最初にLED128でバイト数, その次にバイナリそのまま",
    encodeDefinition(),
    decodeDefinition()
  );

const encodeDefinition = (): ts.Expr =>
  c.encodeLambda(type, (valueVar) => [
    ts.statementReturn(
      ts.callMethod(int32.encode(ts.get(valueVar, "length")), "concat", [
        ts.arrayLiteral([{ expr: valueVar, spread: true }]),
      ])
    ),
  ]);

const decodeDefinition = (): ts.Expr => {
  const lengthName = identifer.fromString("length");
  const lengthVar = ts.variable(lengthName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.variable(nextIndexName);

  return c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    ts.statementVariableDefinition(
      lengthName,
      c.decodeReturnType(ts.typeNumber),
      int32.decode(parameterIndex, parameterBinary)
    ),
    ts.statementVariableDefinition(
      nextIndexName,
      ts.typeNumber,
      ts.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar))
    ),
    c.returnStatement(
      ts.callMethod(parameterBinary, "slice", [
        c.getNextIndex(lengthVar),
        nextIndexVar,
      ]),
      nextIndexVar
    ),
  ]);
};
