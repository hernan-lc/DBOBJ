import { Database, QueryExpr } from "./index";

export type Column<T = any> = {
  name: string;
  _type: T;
};

export type Table<T extends Record<string, Column>> = {
  name: string;
  columns: T;
};

export function table<T extends Record<string, any>>(
  name: string,
  columns: { [K in keyof T]: string }
): Table<{ [K in keyof T]: Column<T[K]> }> {
  const cols: any = {};
  for (const key in columns) {
    cols[key] = { name: columns[key] };
  }
  return { name, columns: cols };
}

export const eq = (col: Column, val: any): QueryExpr => ({
  op: "eq",
  left: { column: col.name },
  right: { literal: val },
});

export const gt = (col: Column, val: any): QueryExpr => ({
  op: "gt",
  left: { column: col.name },
  right: { literal: val },
});

export const gte = (col: Column, val: any): QueryExpr => ({
  op: "gte",
  left: { column: col.name },
  right: { literal: val },
});

export const lt = (col: Column, val: any): QueryExpr => ({
  op: "lt",
  left: { column: col.name },
  right: { literal: val },
});

export const lte = (col: Column, val: any): QueryExpr => ({
  op: "lte",
  left: { column: col.name },
  right: { literal: val },
});

export const neq = (col: Column, val: any): QueryExpr => ({
  op: "neq",
  left: { column: col.name },
  right: { literal: val },
});

export const and = (...exprs: QueryExpr[]): QueryExpr => {
  if (exprs.length === 0) throw new Error("and() requires at least one expression");
  if (exprs.length === 1) return exprs[0];
  return exprs.reduce((acc, curr) => ({
    op: "and",
    left: acc,
    right: curr,
  }));
};

export const or = (...exprs: QueryExpr[]): QueryExpr => {
  if (exprs.length === 0) throw new Error("or() requires at least one expression");
  if (exprs.length === 1) return exprs[0];
  return exprs.reduce((acc, curr) => ({
    op: "or",
    left: acc,
    right: curr,
  }));
};

class SelectBuilder<T extends Table<any>> {
  private _where?: QueryExpr;
  private _limit?: number;
  private _offset?: number;
  private _columns?: string[];

  constructor(private db: Database, private table: T) {}

  where(expr: QueryExpr) {
    this._where = expr;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  offset(n: number) {
    this._offset = n;
    return this;
  }

  execute() {
    return this.db.select(
      this.table.name,
      this._where,
      this._columns,
      this._limit,
      this._offset
    );
  }
}

class UpdateBuilder<T extends Table<any>> {
  private _where?: QueryExpr;

  constructor(private db: Database, private table: T, private values: any) {}

  where(expr: QueryExpr) {
    this._where = expr;
    return this;
  }

  execute() {
    if (!this._where) throw new Error("update structured requires a where clause");
    return this.db.updateStructured(this.table.name, this._where, this.values);
  }
}

class DeleteBuilder<T extends Table<any>> {
  private _where?: QueryExpr;

  constructor(private db: Database, private table: T) {}

  where(expr: QueryExpr) {
    this._where = expr;
    return this;
  }

  execute() {
    if (!this._where) throw new Error("delete structured requires a where clause");
    return this.db.deleteStructured(this.table.name, this._where);
  }
}

export function createOrm(db: Database) {
  return {
    select: <T extends Table<any>>(table: T) => new SelectBuilder(db, table),
    update: <T extends Table<any>>(table: T, values: any) => new UpdateBuilder(db, table, values),
    delete: <T extends Table<any>>(table: T) => new DeleteBuilder(db, table),
  };
}
