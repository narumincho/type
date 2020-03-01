/**
 * 式
 */
export type Expr = { _: Expr_.NumberLiteral, uInt32: number } | { _: Expr_.StringLiteral, string_: string } | { _: Expr_.BooleanLiteral, bool: boolean } | { _: Expr_.NullLiteral } | { _: Expr_.UnaryOperator, unaryOperator: UnaryOperator }
export const enum Expr_ {
  NumberLiteral = 0,
  StringLiteral = 1,
  BooleanLiteral = 2,
  NullLiteral = 3,
  UnaryOperator = 4
}
export const enum UnaryOperator {
  Minus = 0,
  LogicalNot = 1,
  BitwiseNot = 2
}
/**
 * 数値リテラル `123`
 * @param uInt32 
 */
export const exprNumberLiteral = (uInt32: number): Expr => ({ _: Expr_.NumberLiteral, uInt32: uInt32 });

/**
 * 文字列リテラル `"text"` エスケープする必要はない
 * @param string_ 
 */
export const exprStringLiteral = (string_: string): Expr => ({ _: Expr_.StringLiteral, string_: string_ });

/**
 * 真偽値リテラル
 * @param bool 
 */
export const exprBooleanLiteral = (bool: boolean): Expr => ({ _: Expr_.BooleanLiteral, bool: bool });

/**
 * nullリテラル

 */
export const exprNullLiteral = (): Expr => ({ _: Expr_.NullLiteral });

/**
 * 
 * @param unaryOperator 
 */
export const exprUnaryOperator = (unaryOperator: UnaryOperator): Expr => ({ _: Expr_.UnaryOperator, unaryOperator: unaryOperator })
