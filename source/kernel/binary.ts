import * as c from "./codec";
import * as int32 from "./int32";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

export const name = identifer.fromString("Binary");

export const type: ts.Type = tsUtil.uint8ArrayType;

export const codec = (): ts.Expr =>
  tsUtil.get(ts.Expr.Variable(name), util.codecPropertyName);

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
    ts.Statement.Return(
      tsUtil.callMethod(
        int32.encode(tsUtil.get(valueVar, "length")),
        "concat",
        [ts.Expr.ArrayLiteral([{ expr: valueVar, spread: true }])]
      )
    ),
  ]);

const decodeDefinition = (): ts.Expr => {
  const lengthName = identifer.fromString("length");
  const lengthVar = ts.Expr.Variable(lengthName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.Expr.Variable(nextIndexName);

  return c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    ts.Statement.VariableDefinition({
      isConst: true,
      name: lengthName,
      type: c.decodeReturnType(ts.Type.Number),
      expr: int32.decode(parameterIndex, parameterBinary),
    }),
    ts.Statement.VariableDefinition({
      isConst: true,
      name: nextIndexName,
      type: ts.Type.Number,
      expr: tsUtil.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar)),
    }),
    c.returnStatement(
      tsUtil.callMethod(parameterBinary, "slice", [
        c.getNextIndex(lengthVar),
        nextIndexVar,
      ]),
      nextIndexVar
    ),
  ]);
};
