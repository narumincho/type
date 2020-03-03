import { data, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as typeScript from "./type";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.Definition> => {
  return [
    data.definitionFunction(maybeJustCode),
    data.definitionFunction(maybeNothingCode),
    data.definitionFunction(resultOkCode),
    data.definitionFunction(resultErrorCode)
  ].concat(customTypeCode(customTypeList));
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeJustName = identifer.fromString("maybeJust");

export const maybeJustVarEval = (expr: data.Expr): data.Expr =>
  data.call(data.variable(maybeJustName), [expr]);

const maybeJustCode: data.Function = {
  name: maybeJustName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("value"),
      document: "",
      type_: data.typeScopeInFile(identifer.fromString("T"))
    }
  ],
  returnType: typeDef.maybeVar(data.typeScopeInFile(identifer.fromString("T"))),
  typeParameterList: [identifer.fromString("T")],
  statementList: [
    data.statementReturn(
      data.objectLiteral(
        new Map([
          ["_", data.stringLiteral("Just")],
          ["value", data.variable(identifer.fromString("value"))]
        ])
      )
    )
  ]
};

const maybeNothingName = identifer.fromString("maybeNothing");
export const maybeNothingVarEval: data.Expr = data.call(
  data.variable(maybeNothingName),
  []
);

const maybeNothingCode: data.Function = {
  name: maybeNothingName,
  document: "",
  parameterList: [],
  returnType: typeDef.maybeVar(data.typeScopeInFile(identifer.fromString("T"))),
  typeParameterList: [identifer.fromString("T")],
  statementList: [
    data.statementReturn(
      data.objectLiteral(new Map([["_", data.stringLiteral("Nothing")]]))
    )
  ]
};

/* ========================================
                  Result
   ========================================
*/
const resultOkName = identifer.fromString("resultOk");

export const resultOkVarEval = (okExpr: data.Expr): data.Expr =>
  data.call(data.variable(resultOkName), [okExpr]);

const resultOkCode: data.Function = {
  name: resultOkName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("ok"),
      document: "",
      type_: data.typeScopeInFile(identifer.fromString("ok"))
    }
  ],
  returnType: typeDef.resultVar(
    data.typeScopeInFile(identifer.fromString("ok")),
    data.typeScopeInFile(identifer.fromString("error"))
  ),
  typeParameterList: [
    identifer.fromString("ok"),
    identifer.fromString("error")
  ],
  statementList: [
    data.statementReturn(
      data.objectLiteral(
        new Map([
          ["_", data.stringLiteral("Ok")],
          ["ok", data.variable(identifer.fromString("ok"))]
        ])
      )
    )
  ]
};

const resultErrorName = identifer.fromString("resultError");

export const resultErrorVarEval = (errorExpr: data.Expr): data.Expr =>
  data.call(data.variable(resultErrorName), [errorExpr]);

const resultErrorCode: data.Function = {
  name: resultErrorName,
  document: "",
  parameterList: [
    {
      name: identifer.fromString("error"),
      document: "",
      type_: data.typeScopeInFile(identifer.fromString("error"))
    }
  ],
  returnType: typeDef.resultVar(
    data.typeScopeInFile(identifer.fromString("ok")),
    data.typeScopeInFile(identifer.fromString("error"))
  ),
  typeParameterList: [
    identifer.fromString("ok"),
    identifer.fromString("error")
  ],
  statementList: [
    data.statementReturn(
      data.objectLiteral(
        new Map([
          ["_", data.stringLiteral("Error")],
          ["error", data.variable(identifer.fromString("error"))]
        ])
      )
    )
  ]
};

/* ========================================
                  Custom
   ========================================
*/
export const customTypeNameIdentifer = (
  customTypeName: string,
  tagName: string
): identifer.Identifer => {
  return identifer.fromString(
    c.firstLowerCase(customTypeName) + c.firstUpperCase(tagName)
  );
};

const customTypeCode = (
  customTypeList: ReadonlyArray<type.CustomType>
): ReadonlyArray<data.Definition> => {
  const result: Array<data.Definition> = [];
  for (const customType of customTypeList) {
    switch (customType.body._) {
      case "Sum": {
        if (
          typeScript.isProductTypeAllNoParameter(
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
): ReadonlyArray<data.Definition> => {
  return tagNameAndParameterList.map(tagNameAndParameter =>
    tagNameAndParameterToTag(customTypeName, tagNameAndParameter)
  );
};

const tagNameAndParameterToTag = (
  customTypeName: string,
  tagNameAndParameter: type.TagNameAndParameter
): data.Definition => {
  const tagField: [string, data.Expr] = [
    "_",
    data.stringLiteral(tagNameAndParameter.name)
  ];

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return data.definitionFunction({
        name: customTypeNameIdentifer(customTypeName, tagNameAndParameter.name),
        document: tagNameAndParameter.description,
        parameterList: [
          {
            name: typeScript.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            document: "",
            type_: typeScript.typeToGeneratorType(
              tagNameAndParameter.parameter.value
            )
          }
        ],
        typeParameterList: [],
        returnType: data.typeScopeInFile(identifer.fromString(customTypeName)),
        statementList: [
          data.statementReturn(
            data.objectLiteral(
              new Map([
                tagField,
                [
                  typeScript.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  ),
                  data.variable(
                    typeScript.typeToMemberOrParameterName(
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
      return data.definitionVariable({
        name: identifer.fromString(
          c.firstLowerCase(customTypeName) +
            c.firstUpperCase(tagNameAndParameter.name)
        ),
        document: tagNameAndParameter.description,
        type_: data.typeScopeInFile(identifer.fromString(customTypeName)),
        expr: data.objectLiteral(new Map([tagField]))
      });
  }
};
