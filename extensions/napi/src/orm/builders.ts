import { Table, Column, TableConfig } from "./schema";
import { QueryExpr, Database } from "../../index.d";

export type InferSelectModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id: number };

export type InferInsertModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id?: number };

export type PrefixKeys<T, P extends string> = {
  [K in keyof T & string as `${P}.${K}`]: T[K];
};

export type OrderBy = Column<unknown> | { column: Column<unknown>; desc?: boolean };

export class SelectBuilder<T extends Table<any>, R = InferSelectModel<T>> {
  private _where?: QueryExpr;
  private _limit?: number;
  private _offset?: number;
  private _columns?: string[];
  private _orderBy?: Array<{ column: string; desc?: boolean }>;
  private _join?: { table: string, onLeft: string, onRight: string, type: "inner" | "left" };

  constructor(private db: Database, private table: T) {}

  innerJoin<U extends Table<any>>(other: U, onLeft: Column<any>, onRight: Column<any>): SelectBuilder<T, R & PrefixKeys<InferSelectModel<U>, U["name"]>> {
    this._join = {
      table: other.name,
      onLeft: onLeft.name,
      onRight: onRight.name,
      type: "inner"
    };
    return this as any;
  }

  leftJoin<U extends Table<any>>(other: U, onLeft: Column<any>, onRight: Column<any>): SelectBuilder<T, R & Partial<PrefixKeys<InferSelectModel<U>, U["name"]>>> {
    this._join = {
      table: other.name,
      onLeft: onLeft.name,
      onRight: onRight.name,
      type: "left"
    };
    return this as any;
  }

  where(expr: QueryExpr): this {
    this._where = expr;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  orderBy(...orders: Array<OrderBy>): this {
    this._orderBy = orders.map(o => {
      if ("name" in (o as any)) return { column: (o as any).name };
      const ord = o as { column: Column<unknown>; desc?: boolean };
      return { column: ord.column.name, desc: ord.desc };
    });
    return this;
  }

  count(): number {
    const results = this.db.select(
        this.table.name,
        this._where || null,
        ["id"],
        this._orderBy || null,
        this._join || null,
        null,
        null
    );
    return results.length;
  }

  sum(col: Column<number>): number {
    const rows = this.execute();
    return rows.reduce((acc, row) => acc + (row[col.name] as number || 0), 0);
  }

  avg(col: Column<number>): number {
    const rows = this.execute();
    if (rows.length === 0) return 0;
    return this.sum(col) / rows.length;
  }

  min(col: Column<number>): number | null {
    const rows = this.execute();
    if (rows.length === 0) return null;
    return Math.min(...rows.map(r => r[col.name] as number));
  }

  max(col: Column<number>): number | null {
    const rows = this.execute();
    if (rows.length === 0) return null;
    return Math.max(...rows.map(r => r[col.name] as number));
  }

  execute(): R[] {
    return this.db.select(
      this.table.name,
      this._where || null,
      this._columns || null,
      this._orderBy || null,
      this._join || null,
      this._limit || null,
      this._offset || null
    );
  }
}

export class InsertBuilder<T extends Table<any>> {
  constructor(private db: Database, private table: T) {}

  values(data: InferInsertModel<T> | InferInsertModel<T>[]): number[] {
    const rows = Array.isArray(data) ? data : [data];
    const ids: number[] = [];
    for (const row of rows) {
        const values: any[] = [];
        for (const colName in this.table.columns) {
            const col = this.table.columns[colName];
            values.push((row as any)[colName] ?? null);
        }
        const id = this.db.insertRow(this.table.name, values);
        ids.push(Number(id));
    }
    return ids;
  }
}

export class UpdateBuilder<T extends Table<any>> {
  private _where?: QueryExpr;

  constructor(private db: Database, private table: T, private values: Partial<InferInsertModel<T>>) {}

  where(expr: QueryExpr): this {
    this._where = expr;
    return this;
  }

  execute(): number {
    if (!this._where) throw new Error("Update requires a where clause");
    return this.db.updateStructured(this.table.name, this._where, this.values as Record<string, unknown>);
  }
}

export class DeleteBuilder<T extends Table<any>> {
  private _where?: QueryExpr;

  constructor(private db: Database, private table: T) {}

  where(expr: QueryExpr): this {
    this._where = expr;
    return this;
  }

  execute(): number {
    if (!this._where) throw new Error("Delete requires a where clause");
    return this.db.deleteStructured(this.table.name, this._where);
  }
}

export function createOrm(db: Database) {
  return {
    select: <T extends TableConfig>(table: Table<T>) => new SelectBuilder<Table<T>>(db, table),
    insert: <T extends TableConfig>(table: Table<T>) => new InsertBuilder(db, table),
    update: <T extends TableConfig>(table: Table<T>, values: Partial<InferInsertModel<Table<T>>>) => new UpdateBuilder(db, table, values),
    delete: <T extends TableConfig>(table: Table<T>) => new DeleteBuilder(db, table),
  };
}
