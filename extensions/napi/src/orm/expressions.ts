import { Column } from "./schema";
import { QueryExpr } from "../../index.d";

export function eq<T>(col: Column<T>, val: T): QueryExpr {
  return { op: "eq", left: { column: col.name }, right: { literal: val } };
}

export function ne<T>(col: Column<T>, val: T): QueryExpr {
  return { op: "neq", left: { column: col.name }, right: { literal: val } };
}

export function gt<T>(col: Column<T>, val: T): QueryExpr {
  return { op: "gt", left: { column: col.name }, right: { literal: val } };
}

export function gte<T>(col: Column<T>, val: T): QueryExpr {
  return { op: "gte", left: { column: col.name }, right: { literal: val } };
}

export function lt<T>(col: Column<T>, val: T): QueryExpr {
  return { op: "lt", left: { column: col.name }, right: { literal: val } };
}

export function lte<T>(col: Column<T>, val: T): QueryExpr {
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

export function isNull(col: Column<unknown>): QueryExpr {
  return { op: "eq", left: { column: col.name }, right: { literal: null } };
}

export function isNotNull(col: Column<unknown>): QueryExpr {
  return { op: "neq", left: { column: col.name }, right: { literal: null } };
}

export function like(col: Column<string>, pattern: string): QueryExpr {
  return { op: "like", left: { column: col.name }, right: { literal: pattern } };
}

export function inArray<T>(col: Column<T>, values: T[]): QueryExpr {
  return { op: "in", left: { column: col.name }, right: { literal: JSON.stringify(values) } };
}

export function notInArray<T>(col: Column<T>, values: T[]): QueryExpr {
  return { not: inArray(col, values) };
}

export function between<T>(col: Column<T>, min: T, max: T): QueryExpr {
  return and(gte(col, min), lte(col, max));
}

export function notBetween<T>(col: Column<T>, min: T, max: T): QueryExpr {
  return { not: between(col, min, max) };
}

export function asc(col: Column<any>): { column: string; desc: boolean } {
  return { column: col.name, desc: false };
}

export function desc(col: Column<any>): { column: string; desc: boolean } {
  return { column: col.name, desc: true };
}
