import * as c from "./codec";
import * as int32 from "./int32";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

export const name = identifer.fromString("String");

export const type = ts.Type.String;

export const codec = (): ts.Expr =>
  tsUtil.get(ts.Expr.Variable(name), util.codecPropertyName);

export const exprDefinition = (): ts.Variable =>
  c.variableDefinition(
    name,
    type,
    "文字列. JavaScriptのstringで扱う",
    "stringをUTF-8のバイナリに変換する",
    encodeDefinition(),
    decodeDefinition()
  );

const globalProcess = ts.Expr.GlobalObjects(identifer.fromString("process"));

const encodeDefinition = (): ts.Expr => {
  const resultName = identifer.fromString("result");
  const resultVar = ts.Expr.Variable(resultName);

  return c.encodeLambda(type, (valueVar) => [
    ts.statementVariableDefinition(
      resultName,
      tsUtil.readonlyArrayType(ts.Type.Number),
      ts.Expr.ArrayLiteral([
        {
          expr: tsUtil.callMethod(
            ts.newExpr(
              ts.conditionalOperator(
                tsUtil.logicalOr(
                  tsUtil.equal(globalProcess, ts.Expr.UndefinedLiteral),
                  tsUtil.equal(
                    tsUtil.get(globalProcess, "title"),
                    ts.Expr.StringLiteral("browser")
                  )
                ),
                ts.Expr.GlobalObjects(identifer.fromString("TextEncoder")),
                ts.Expr.ImportedVariable({
                  moduleName: "util",
                  name: identifer.fromString("TextEncoder"),
                })
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
      tsUtil.callMethod(
        int32.encode(tsUtil.get(resultVar, "length")),
        "concat",
        [resultVar]
      )
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
      tsUtil.callMethod(parameterBinary, "slice", [
        c.getNextIndex(lengthVar),
        nextIndexVar,
      ])
    ),
    ts.statementVariableDefinition(
      isBrowserName,
      ts.Type.Boolean,
      tsUtil.logicalOr(
        tsUtil.equal(globalProcess, ts.Expr.UndefinedLiteral),
        tsUtil.equal(
          tsUtil.get(globalProcess, "title"),
          ts.Expr.StringLiteral("browser")
        )
      )
    ),
    ts.Statement.If(ts.Expr.Variable(isBrowserName), [
      c.returnStatement(
        tsUtil.callMethod(
          ts.Expr.New({
            expr: ts.Expr.GlobalObjects(identifer.fromString("TextDecoder")),
            parameterList: [],
          }),
          "decode",
          [textBinaryVar]
        ),
        nextIndexVar
      ),
    ]),
    c.returnStatement(
      tsUtil.callMethod(
        ts.Expr.New({
          expr: ts.Expr.ImportedVariable({
            moduleName: "util",
            name: identifer.fromString("TextDecoder"),
          }),
          parameterList: [],
        }),
        "decode",
        [textBinaryVar]
      ),
      nextIndexVar
    ),
  ]);
};
