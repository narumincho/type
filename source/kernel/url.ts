import * as c from "./codec";
import * as s from "./string";
import * as ts from "js-ts-code-generator/distribution/newData";
import * as util from "../util";
import { identifer, data as tsUtil } from "js-ts-code-generator";

const name = identifer.fromString("Url");

export const type = ts.Type.ScopeInGlobal(identifer.fromString("URL"));

export const codec = (): ts.Expr =>
  tsUtil.get(ts.Expr.Variable(name), util.codecPropertyName);

export const variableDefinition = (): ts.Variable => ({
  name,
  document: "URL. JavaScriptのURLで扱う",
  type: ts.Type.Object([
    {
      name: util.codecPropertyName,
      required: true,
      type: c.codecType(type),
      document:
        "文字列表現を直接入れる. URLコンストラクタでURLの形式かどうか調べる",
    },
  ]),
  expr: ts.Expr.ObjectLiteral([
    ts.Member.KeyValue({
      key: util.codecPropertyName,
      value: ts.Expr.ObjectLiteral([
        ts.Member.KeyValue({
          key: util.encodePropertyName,
          value: encodeDefinition(),
        }),
        ts.Member.KeyValue({
          key: util.decodePropertyName,
          value: decodeDefinition(),
        }),
      ]),
    }),
  ]),
});

const encodeDefinition = (): ts.Expr => {
  return c.encodeLambda(type, (value) => [
    ts.Statement.Return(
      ts.Expr.Call({
        expr: tsUtil.get(s.codec(), util.encodePropertyName),
        parameterList: [tsUtil.callMethod(value, "toString", [])],
      })
    ),
  ]);
};

const decodeDefinition = (): ts.Expr => {
  const stringResultName = identifer.fromString("stringResult");
  return c.decodeLambda(type, (parameterIndex, parameterBinary) => [
    ts.Statement.VariableDefinition({
      isConst: true,
      name: stringResultName,
      type: c.decodeReturnType(s.type),
      expr: ts.Expr.Call({
        expr: tsUtil.get(s.codec(), util.decodePropertyName),
        parameterList: [parameterIndex, parameterBinary],
      }),
    }),
    c.returnStatement(
      ts.Expr.New({
        expr: ts.Expr.GlobalObjects(identifer.fromString("URL")),
        parameterList: [c.getResult(ts.Expr.Variable(stringResultName))],
      }),
      c.getNextIndex(ts.Expr.Variable(stringResultName))
    ),
  ]);
};
