import * as c from "./codec";
import * as int32 from "./int32";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

export const name = identifer.fromString("String");

export const type = ts.typeString;

export const codec = (): ts.Expr =>
  ts.get(ts.variable(name), util.codecPropertyName);

export const exprDefinition = (): ts.Variable => ({
  name,
  document: "文字列. JavaScriptのstringで扱う",
  type: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type: c.codecType(type),
          document: "stringをUTF-8のバイナリに変換する",
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
  const resultName = identifer.fromString("result");
  const resultVar = ts.variable(resultName);

  return c.encodeLambda(type, (valueVar) => [
    ts.statementVariableDefinition(
      resultName,
      ts.readonlyArrayType(ts.typeNumber),
      ts.arrayLiteral([
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
    ts.statementReturn(
      ts.callMethod(int32.encode(ts.get(resultVar, "length")), "concat", [
        resultVar,
      ])
    ),
  ]);
};

const decodeDefinition = (): ts.Expr => {
  const lengthName = identifer.fromString("length");
  const lengthVar = ts.variable(lengthName);
  const nextIndexName = identifer.fromString("nextIndex");
  const nextIndexVar = ts.variable(nextIndexName);
  const textBinaryName = identifer.fromString("textBinary");
  const textBinaryVar = ts.variable(textBinaryName);
  const isBrowserName = identifer.fromString("isBrowser");

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
    ts.statementIf(ts.variable(isBrowserName), [
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
