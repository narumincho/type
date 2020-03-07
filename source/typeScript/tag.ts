import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<ts.Definition> => {
  return [
    ts.definitionFunction(maybeJustCode),
    ts.definitionFunction(maybeNothingCode),
    ts.definitionFunction(resultOkCode),
    ts.definitionFunction(resultErrorCode)
  ].concat(customTypeCode(customTypeList));
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeJustName = identifer.fromString("maybeJust");

export const maybeJustVarEval = (expr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(maybeJustName), [expr]);

const maybeJustCode: ts.Function = {
  name: maybeJustName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("value"),
      document: "",
      type_: ts.typeScopeInFile(identifer.fromString("T"))
    }
  ],
  returnType: typeDef.maybeVar(ts.typeScopeInFile(identifer.fromString("T"))),
  typeParameterList: [identifer.fromString("T")],
  statementList: [
    ts.statementReturn(
      ts.objectLiteral(
        new Map([
          ["_", ts.stringLiteral("Just")],
          ["value", ts.variable(identifer.fromString("value"))]
        ])
      )
    )
  ]
};

const maybeNothingName = identifer.fromString("maybeNothing");
export const maybeNothingVarEval: ts.Expr = ts.call(
  ts.variable(maybeNothingName),
  []
);

const maybeNothingCode: ts.Function = {
  name: maybeNothingName,
  document: "",
  parameterList: [],
  returnType: typeDef.maybeVar(ts.typeScopeInFile(identifer.fromString("T"))),
  typeParameterList: [identifer.fromString("T")],
  statementList: [
    ts.statementReturn(
      ts.objectLiteral(new Map([["_", ts.stringLiteral("Nothing")]]))
    )
  ]
};

/* ========================================
                  Result
   ========================================
*/
const resultOkName = identifer.fromString("resultOk");

export const resultOkVarEval = (okExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultOkName), [okExpr]);

const resultOkCode: ts.Function = {
  name: resultOkName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("ok"),
      document: "",
      type_: ts.typeScopeInFile(identifer.fromString("ok"))
    }
  ],
  returnType: typeDef.resultVar(
    ts.typeScopeInFile(identifer.fromString("ok")),
    ts.typeScopeInFile(identifer.fromString("error"))
  ),
  typeParameterList: [
    identifer.fromString("ok"),
    identifer.fromString("error")
  ],
  statementList: [
    ts.statementReturn(
      ts.objectLiteral(
        new Map([
          ["_", ts.stringLiteral("Ok")],
          ["ok", ts.variable(identifer.fromString("ok"))]
        ])
      )
    )
  ]
};

const resultErrorName = identifer.fromString("resultError");

export const resultErrorVarEval = (errorExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultErrorName), [errorExpr]);

const resultErrorCode: ts.Function = {
  name: resultErrorName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("error"),
      document: "",
      type_: ts.typeScopeInFile(identifer.fromString("error"))
    }
  ],
  returnType: typeDef.resultVar(
    ts.typeScopeInFile(identifer.fromString("ok")),
    ts.typeScopeInFile(identifer.fromString("error"))
  ),
  typeParameterList: [
    identifer.fromString("ok"),
    identifer.fromString("error")
  ],
  statementList: [
    ts.statementReturn(
      ts.objectLiteral(
        new Map([
          ["_", ts.stringLiteral("Error")],
          ["error", ts.variable(identifer.fromString("error"))]
        ])
      )
    )
  ]
};

/* ========================================
                  Custom
   ========================================
*/
const customTypeNameIdentifer = (
  customTypeName: string,
  tagName: string
): identifer.Identifer => {
  return identifer.fromString(
    c.firstLowerCase(customTypeName) + c.firstUpperCase(tagName)
  );
};

export const customTypeVar = (
  customTypeName: string,
  tagName: string
): ts.Expr => ts.variable(customTypeNameIdentifer(customTypeName, tagName));

const customTypeCode = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<ts.Definition> => {
  const result: Array<ts.Definition> = [];
  for (const customType of customTypeList) {
    switch (customType.body._) {
      case "Sum": {
        if (
          type.isProductTypeAllNoParameter(
            customType.body.tagNameAndParameterArray
          )
        ) {
          break;
        }
        const definitionList = productTypeToTagList(
          customType.name,
          customType.body.tagNameAndParameterArray
        );
        for (const definition of definitionList) {
          result.push(definition);
        }
      }
    }
  }
  return result;
};

const productTypeToTagList = (
  customTypeName: string,
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyArray<ts.Definition> => {
  return tagNameAndParameterList.map(tagNameAndParameter =>
    tagNameAndParameterToTag(customTypeName, tagNameAndParameter)
  );
};

const tagNameAndParameterToTag = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter
): ts.Definition => {
  const tagField: [string, ts.Expr] = [
    "_",
    ts.stringLiteral(tagNameAndParameter.name)
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.definitionFunction({
        name: customTypeNameIdentifer(customTypeName, tagNameAndParameter.name),
        document: tagNameAndParameter.description,
        parameterList: [
          {
            name: util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            document: "",
            type_: util.typeToTypeScriptType(
              tagNameAndParameter.parameter.value
            )
          }
        ],
        typeParameterList: [],
        returnType: ts.typeScopeInFile(identifer.fromString(customTypeName)),
        statementList: [
          ts.statementReturn(
            ts.objectLiteral(
              new Map([
                tagField,
                [
                  util.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  ),
                  ts.variable(
                    util.typeToMemberOrParameterName(
                      tagNameAndParameter.parameter.value
                    )
                  )
                ]
              ])
            )
          )
        ]
      });

    case "Nothing":
      return ts.definitionVariable({
        name: identifer.fromString(
          c.firstLowerCase(customTypeName) +
            c.firstUpperCase(tagNameAndParameter.name)
        ),
        document: tagNameAndParameter.description,
        type_: ts.typeScopeInFile(identifer.fromString(customTypeName)),
        expr: ts.objectLiteral(new Map([tagField]))
      });
  }
};
