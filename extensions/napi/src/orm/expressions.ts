import { QueryExpr, Column } from "./schema";

export function eq(col: Column, val: any): QueryExpr {
  return { op: "eq", left: { column: col.name }, right: { literal: val } };
}

export function ne(col: Column, val: any): QueryExpr {
  return { op: "neq", left: { column: col.name }, right: { literal: val } };
}

export function gt(col: Column, val: any): QueryExpr {
  return { op: "gt", left: { column: col.name }, right: { literal: val } };
}

export function gte(col: Column, val: any): QueryExpr {
  return { op: "gte", left: { column: col.name }, right: { literal: val } };
}

export function lt(col: Column, val: any): QueryExpr {
  return { op: "lt", left: { column: col.name }, right: { literal: val } };
}

export function lte(col: Column, val: any): QueryExpr {
  return { op: "lte", left: { column: col.name }, right: { literal: val } };
}

export function and(...exprs: QueryExpr[]): QueryExpr {
  if (exprs.length === 0) throw new Error("and() requires at least one expression");
  if (exprs.length === 1) return exprs[0];
  return exprs.reduce((acc, curr) => ({ op: "and", left: acc, right: curr }));
}

export function or(...exprs: QueryExpr[]): QueryExpr {
  if (exprs.length === 0) throw new Error("or() requires at least one expression");
  if (exprs.length === 1) return exprs[0];
  return exprs.reduce((acc, curr) => ({ op: "or", left: acc, right: curr }));
}

export function not(expr: QueryExpr): QueryExpr {
  return { not: expr };
}

export function isNull(col: Column): QueryExpr {
  return { op: "eq", left: { column: col.name }, right: { literal: null } };
}

export function isNotNull(col: Column): QueryExpr {
  return { op: "neq", left: { column: col.name }, right: { literal: null } };
}

export function like(col: Column, pattern: string): QueryExpr {
  return { op: "like", left: { column: col.name }, right: { literal: pattern } };
}
