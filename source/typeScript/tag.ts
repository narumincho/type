import { data as ts, identifer } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): ReadonlyArray<ts.Definition> => {
  return [
    ...customTypeDefinitionToTagFunction(typeDef.maybeCustomTypeDefinition),
    ...customTypeDefinitionToTagFunction(typeDef.resultCustomTypeDefinition),
    ...[...customTypeList.map(customTypeDefinitionToTagFunction)][0],
  ];
};

/* ========================================
                  Maybe
   ========================================
*/

const maybeJustName = identifer.fromString("maybeJust");

export const maybeJustVarEval = (expr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(maybeJustName), [expr]);

const maybeNothingName = identifer.fromString("maybeNothing");
export const maybeNothingVarEval: ts.Expr = ts.call(
  ts.variable(maybeNothingName),
  []
);

/* ========================================
                  Result
   ========================================
*/
const resultOkName = identifer.fromString("resultOk");

export const resultOkVarEval = (okExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultOkName), [okExpr]);

const resultErrorName = identifer.fromString("resultError");

export const resultErrorVarEval = (errorExpr: ts.Expr): ts.Expr =>
  ts.call(ts.variable(resultErrorName), [errorExpr]);

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

const customTypeDefinitionToTagFunction = (
  customType: type.CustomTypeDefinition
): ReadonlyArray<ts.Definition> => {
  switch (customType.body._) {
    case "Sum": {
      if (
        type.isProductTypeAllNoParameter(
          customType.body.tagNameAndParameterList
        )
      ) {
        return [];
      }
      const definitionList = productTypeToTagList(
        customType.name,
        customType.typeParameterList,
        customType.body.tagNameAndParameterList
      );
      return definitionList;
    }
    case "Product":
      return [];
  }
};

const productTypeToTagList = (
  customTypeName: string,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): ReadonlyArray<ts.Definition> => {
  return tagNameAndParameterList.map((tagNameAndParameter) =>
    tagNameAndParameterToTag(
      customTypeName,
      typeParameterList,
      tagNameAndParameter
    )
  );
};

const tagNameAndParameterToTag = (
  customTypeName: string,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameter: type.TagNameAndParameter
): ts.Definition => {
  const tagField: ts.Member = ts.memberKeyValue(
    "_",
    ts.stringLiteral(tagNameAndParameter.name)
  );
  const returnType =
    typeParameterList.length === 0
      ? ts.typeScopeInFile(identifer.fromString(customTypeName))
      : ts.typeWithParameter(
          ts.typeScopeInFile(identifer.fromString(customTypeName)),
          typeParameterList.map((typeParameter) =>
            ts.typeScopeInFile(identifer.fromString(typeParameter))
          )
        );

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.definitionFunction({
        name: customTypeNameIdentifer(customTypeName, tagNameAndParameter.name),
        document: tagNameAndParameter.description,
        typeParameterList: typeParameterList.map(identifer.fromString),
        parameterList: [
          {
            name: util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            document: "",
            type_: util.typeToTypeScriptType(
              tagNameAndParameter.parameter.value
            ),
          },
        ],
        returnType: returnType,
        statementList: [
          ts.statementReturn(
            ts.objectLiteral([
              tagField,
              ts.memberKeyValue(
                util.typeToMemberOrParameterName(
                  tagNameAndParameter.parameter.value
                ),
                ts.variable(
                  util.typeToMemberOrParameterName(
                    tagNameAndParameter.parameter.value
                  )
                )
              ),
            ])
          ),
        ],
      });

    case "Nothing":
      {
        if (typeParameterList.length === 0) {
          return ts.definitionVariable({
            name: identifer.fromString(
              c.firstLowerCase(customTypeName) +
                c.firstUpperCase(tagNameAndParameter.name)
            ),
            document: tagNameAndParameter.description,
            type_: returnType,
            expr: ts.objectLiteral([tagField]),
          });
        }
      }
      return ts.definitionFunction({
        name: identifer.fromString(
          c.firstLowerCase(customTypeName) +
            c.firstUpperCase(tagNameAndParameter.name)
        ),
        document: tagNameAndParameter.description,
        typeParameterList: typeParameterList.map(identifer.fromString),
        parameterList: [],
        returnType: returnType,
        statementList: [ts.statementReturn(ts.objectLiteral([tagField]))],
      });
  }
};
