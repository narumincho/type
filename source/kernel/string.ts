import { data as ts, identifer } from "js-ts-code-generator";
import * as util from "../util";
import * as c from "./codec";
import * as int32 from "./int32";

const name = identifer.fromString("String");

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
  document: "文字列. JavaScriptのstringで扱う",
  type_: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          type_: c.codecType(ts.typeString, true),
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

  const resultExpr: ts.Expr = ts.arrayLiteral([
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
        "encode",
        [ts.variable(identifer.fromString("text"))]
      ),
      spread: true,
    },
  ]);

  return ts.lambda(
    [
      {
        name: identifer.fromString("text"),
        type_: ts.typeString,
      },
    ],
    [],
    c.encodeReturnType,
    [
      ts.statementVariableDefinition(
        resultName,
        ts.readonlyArrayType(ts.typeNumber),
        resultExpr
      ),
      ts.statementReturn(
        ts.callMethod(
          int32.encode(true, ts.get(resultVar, "length")),
          "concat",
          [resultVar]
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
  const textBinaryName = identifer.fromString("textBinary");
  const textBinaryVar = ts.variable(textBinaryName);
  const isBrowserName = identifer.fromString("isBrowser");

  return ts.lambda(
    c.decodeParameterList,
    [],
    c.decodeReturnType(ts.typeString),
    [
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
      ts.statementVariableDefinition(
        textBinaryName,
        ts.uint8ArrayType,
        ts.callMethod(c.parameterBinary, "slice", [
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
            ts.newExpr(
              ts.globalObjects(identifer.fromString("TextDecoder")),
              []
            ),
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
    ]
  );
};
