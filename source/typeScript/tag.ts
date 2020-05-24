import { data as ts, identifer, data } from "js-ts-code-generator";
import * as type from "../type";
import * as util from "./util";
import * as c from "../case";
import * as typeDef from "./typeDefinition";

export const generate = (
  customTypeList: ReadonlyArray<type.CustomTypeDefinition>
): ReadonlyArray<ts.Definition> => {
  const customTypeAndDefaultTypeList: ReadonlyArray<type.CustomTypeDefinition> = [
    typeDef.maybeCustomTypeDefinition,
    typeDef.resultCustomTypeDefinition,
    ...customTypeList,
  ];
  const result: Array<ts.Definition> = [];
  for (const customType of customTypeAndDefaultTypeList) {
    const definition = customTypeDefinitionToTagFunction(customType);
    if (definition !== undefined) {
      result.push(definition);
    }
  }
  return result;
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
): ts.Definition | undefined => {
  switch (customType.body._) {
    case "Sum": {
      return ts.definitionVariable(
        sumTypeToTagVariableDefinition(
          customType.name,
          customType.description,
          customType.typeParameterList,
          customType.body.tagNameAndParameterList
        )
      );
    }
    case "Product":
      return undefined;
  }
};

const sumTypeToTagVariableDefinition = (
  typeName: string,
  description: string,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameterList: ReadonlyArray<type.TagNameAndParameter>
): ts.Variable => {
  return {
    name: identifer.fromString(typeName),
    document: description,
    type_: ts.typeObject(
      new Map(
        tagNameAndParameterList.map((tagNameAndParameter) => [
          tagNameAndParameter.name,
          {
            type_: tagNameAndParameterToTagExprType(
              typeName,
              typeParameterList,
              tagNameAndParameter
            ),
            document: tagNameAndParameter.description,
          },
        ])
      )
    ),
    expr: ts.objectLiteral(
      tagNameAndParameterList.map((tagNameAndParameter) =>
        ts.memberKeyValue(
          tagNameAndParameter.name,
          type.isProductTypeAllNoParameter(tagNameAndParameterList)
            ? ts.stringLiteral(tagNameAndParameter.name)
            : tagNameAndParameterToTagExpr(
                typeName,
                typeParameterList,
                tagNameAndParameter
              )
        )
      )
    ),
  };
};

const tagNameAndParameterToTagExprType = (
  typeName: string,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameter: type.TagNameAndParameter
) => {
  const typeParameterIdentiferList = typeParameterList.map(
    identifer.fromString
  );
  const returnType = ts.typeWithParameter(
    ts.typeScopeInFile(identifer.fromString(typeName)),
    typeParameterIdentiferList.map((typeParameterIdentifer) =>
      ts.typeScopeInFile(typeParameterIdentifer)
    )
  );

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.typeFunction(
        typeParameterIdentiferList,
        [util.typeToTypeScriptType(tagNameAndParameter.parameter.value)],
        returnType
      );

    case "Nothing":
      {
        if (typeParameterList.length === 0) {
          return returnType;
        }
      }
      return ts.typeFunction(typeParameterIdentiferList, [], returnType);
  }
};

const tagNameAndParameterToTagExpr = (
  typeName: string,
  typeParameterList: ReadonlyArray<string>,
  tagNameAndParameter: type.TagNameAndParameter
): ts.Expr => {
  const tagField: ts.Member = ts.memberKeyValue(
    "_",
    ts.stringLiteral(tagNameAndParameter.name)
  );
  const returnType = ts.typeWithParameter(
    ts.typeScopeInFile(identifer.fromString(typeName)),
    typeParameterList.map((typeParameter) =>
      ts.typeScopeInFile(identifer.fromString(typeParameter))
    )
  );

  switch (tagNameAndParameter.parameter._) {
    case "Just":
      return ts.lambda(
        [
          {
            name: util.typeToMemberOrParameterName(
              tagNameAndParameter.parameter.value
            ),
            type_: util.typeToTypeScriptType(
              tagNameAndParameter.parameter.value
            ),
          },
        ],
        typeParameterList.map(identifer.fromString),
        returnType,
        [
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
        ]
      );

    case "Nothing":
      if (typeParameterList.length === 0) {
        return ts.objectLiteral([tagField]);
      }
      return ts.lambda(
        [],
        typeParameterList.map(identifer.fromString),
        returnType,
        [ts.statementReturn(ts.objectLiteral([tagField]))]
      );
  }
};
