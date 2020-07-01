import * as c from "./codec";
import * as s from "./string";
import * as util from "../util";
import { identifer, data as ts } from "js-ts-code-generator";

const name = identifer.fromString("Url");

export const type = ts.typeScopeInGlobal(identifer.fromString("URL"));

export const codec = (): ts.Expr =>
  ts.get(ts.Expr.Variable(name), util.codecPropertyName);

export const variableDefinition = (): ts.Variable => ({
  name,
  document: "URL. JavaScriptのURLで扱う",
  type: ts.typeObject(
    new Map([
      [
        util.codecPropertyName,
        {
          required: true,
          type: c.codecType(type),
          document:
            "文字列表現を直接入れる. URLコンストラクタでURLの形式かどうか調べる",
        },
      ],
    ])
  ),
  expr: ts.Expr.ObjectLiteral([
    ts.Member.KeyValue(
      util.codecPropertyName,
      ts.Expr.ObjectLiteral([
        ts.Member.KeyValue(util.encodePropertyName, encodeDefinition()),
        ts.Member.KeyValue(util.decodePropertyName, decodeDefinition()),
      ])
    ),
  ]),
});

const encodeDefinition = (): ts.Expr => {
  return c.encodeLambda(type, (value) => [
    ts.Statement.Return(
      ts.call(ts.get(s.codec(), util.encodePropertyName), [
        ts.callMethod(value, "toString", []),
      ])
    ),
  ]);
};

const decodeDefinition = (): ts.Expr => {
  const stringResultName = identifer.fromString("stringResult");
  return c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    ts.statementVariableDefinition(
      stringResultName,
      c.decodeReturnType(s.type),
      ts.call(ts.get(s.codec(), util.decodePropertyName), [
        parameterIndex,
        parameterBinary,
      ])
    ),
    c.returnStatement(
      ts.newExpr(ts.globalObjects(identifer.fromString("URL")), [
        c.getResult(ts.Expr.Variable(stringResultName)),
      ]),
      c.getNextIndex(ts.Expr.Variable(stringResultName))
    ),
  ]);
};
