import * as c from "./codec";
import * as int32 from "./int32";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const name = identifer.fromString("String");

export const type = ts.typeString;

export const codec = (): ts.Expr =>
  ts.get(ts.Expr.Variable(name), util.codecPropertyName);

export const exprDefinition = (): ts.Variable =>
  c.variableDefinition(
    name,
    type,
    "文字列. JavaScriptのstringで扱う",
    "stringをUTF-8のバイナリに変換する",
    encodeDefinition(),
    decodeDefinition()
  );

const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);

  return c.encodeLambda(type, (valueVar) => [
    ts.statementVariableDefinition(
      resultName,
      ts.readonlyArrayType(ts.Type.Number),
      ts.Expr.ArrayLiteral([
        {
          expr: ts.callMethod(
            ts.newExpr(
              ts.conditionalOperator(
                ts.logicalOr(
                  ts.equal(
                    ts.globalObjects(identifer.fromString("process")),
                    ts.undefinedLiteral
                  ),
                  ts.equal(
                    ts.get(
                      ts.globalObjects(identifer.fromString("process")),
                      "title"
                    ),
                    ts.stringLiteral("browser")
                  )
                ),
                ts.globalObjects(identifer.fromString("TextEncoder")),
                ts.importedVariable("util", identifer.fromString("TextEncoder"))
              ),
              []
            ),
            util.encodePropertyName,
            [valueVar]
          ),
          spread: true,
        },
      ])
    ),
    ts.Statement.Return(
      ts.callMethod(int32.encode(ts.get(resultVar, "length")), "concat", [
        resultVar,
      ])
    ),
  ]);
};

const decodeDefinition = (): ts.Expr => {
  const lengthName = identifer.fromString("length");
  const lengthVar = ts.Expr.Variable(lengthName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.Expr.Variable(nextIndexName);
  const textBinaryName = identifer.fromString("textBinary");
  const textBinaryVar = ts.Expr.Variable(textBinaryName);
  const isBrowserName = identifer.fromString("isBrowser");

  return c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    ts.statementVariableDefinition(
      lengthName,
      c.decodeReturnType(ts.Type.Number),
      int32.decode(parameterIndex, parameterBinary)
    ),
    ts.statementVariableDefinition(
      nextIndexName,
      ts.Type.Number,
      ts.addition(c.getNextIndex(lengthVar), c.getResult(lengthVar))
    ),
    ts.statementVariableDefinition(
      textBinaryName,
      ts.uint8ArrayType,
      ts.callMethod(parameterBinary, "slice", [
        c.getNextIndex(lengthVar),
        nextIndexVar,
      ])
    ),
    ts.statementVariableDefinition(
      isBrowserName,
      ts.typeBoolean,
      ts.logicalOr(
        ts.equal(
          ts.globalObjects(identifer.fromString("process")),
          ts.undefinedLiteral
        ),
        ts.equal(
          ts.get(ts.globalObjects(identifer.fromString("process")), "title"),
          ts.stringLiteral("browser")
        )
      )
    ),
    ts.statementIf(ts.Expr.Variable(isBrowserName), [
      c.returnStatement(
        ts.callMethod(
          ts.newExpr(ts.globalObjects(identifer.fromString("TextDecoder")), []),
          "decode",
          [textBinaryVar]
        ),
        nextIndexVar
      ),
    ]),
    c.returnStatement(
      ts.callMethod(
        ts.newExpr(
          ts.importedVariable("util", identifer.fromString("TextDecoder")),
          []
        ),
        "decode",
        [textBinaryVar]
      ),
      nextIndexVar
    ),
  ]);
};
