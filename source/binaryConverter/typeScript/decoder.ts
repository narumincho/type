import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as type from "../../type";
import * as typeScript from "../../typeScript";

export const generateCode = (
  customTypeDictionary: ReadonlyMap<string, type.CustomType>,
  isBrowser: boolean
): ReadonlyMap<string, generator.ExportFunction> => {
  const needDecodeTypeList = type.customTypeDictionaryCollectType(
    customTypeDictionary
  );
  let typeDecoderList: ReadonlyArray<[string, generator.ExportFunction]> = [];
  for (const uniqueNeedEncodeType of needDecodeTypeList) {
    typeDecoderList = typeDecoderList.concat(
      encodeCode(uniqueNeedEncodeType, isBrowser)
    );
  }

  return new Map(
    [...customTypeDictionary]
      .map(([name, customType]) => customCode(name, customType))
      .concat(typeDecoderList)
  );
};

/**
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
export const resultAndNextIndexReturnStatement = (
  resultExpr: expr.Expr,
  nextIndexExpr: expr.Expr
): expr.Statement =>
  expr.returnStatement(
    expr.objectLiteral(
      new Map([
        ["result", resultExpr],
        ["nextIndex", nextIndexExpr]
      ])
    )
  );

const parameterList: ReadonlyArray<{
  name: string;
  typeExpr: typeExpr.TypeExpr;
  document: string;
}> = [
  {
    name: "index",
    typeExpr: typeExpr.typeNumber,
    document: "バイナリを読み込み開始位置"
  },
  {
    name: "binary",
    typeExpr: typeExpr.globalType("Uint8Array"),
    document: "バイナリ"
  }
];

/**
 * ```ts
 * { result: T, nextIndex: number }
 * ```
 * を表現するコード
 */
export const returnType = (resultType: typeExpr.TypeExpr): typeExpr.TypeExpr =>
  typeExpr.object(
    new Map([
      ["result", { typeExpr: resultType, document: "" }],
      ["nextIndex", { typeExpr: typeExpr.typeNumber, document: "" }]
    ])
  );

const encodeCode = (
  type_: type.Type,
  isBrowse: boolean
): ReadonlyArray<[string, generator.ExportFunction]> => {
  return [];
};

const customCode = (
  customTypeName: string,
  customType: type.CustomType
): [string, generator.ExportFunction] => {
  return [
    decodeName(type.typeCustom(customTypeName)),
    {
      document: "",
      parameterList: parameterList,
      returnType: returnType(
        typeScript.typeToGeneratorType(type.typeCustom(customTypeName))
      ),
      statementList: []
    }
  ];
};

const decodeName = (type_: type.Type): string => {
  return "decode" + type.toTypeName(type_);
};
