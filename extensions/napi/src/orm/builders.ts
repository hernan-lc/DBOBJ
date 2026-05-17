import { Table, Column, TableConfig } from "./schema";
import { QueryExpr, Database } from "../../index.d";

export type InferSelectModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id: number };

export type InferInsertModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id?: number };

export class SelectBuilder<T extends Table<any>> {
  private _where?: QueryExpr;
  private _limit?: number;
  private _offset?: number;
  private _columns?: string[];
  private _orderBy?: Array<{ column: string; desc?: boolean }>;
  private _join?: { table: string, onLeft: string, onRight: string };

  constructor(private db: Database, private table: T) {}

  innerJoin<U extends Table<any>>(other: U, onLeft: Column<any>, onRight: Column<any>): this {
    this._join = {
      table: other.name,
      onLeft: onLeft.name,
      onRight: onRight.name
    };
    return this;
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

  orderBy(...orders: Array<Column<unknown> | { column: Column<unknown>; desc?: boolean }>): this {
    this._orderBy = orders.map(o => {
      if ("name" in o) return { column: o.name };
      return { column: o.column.name, desc: o.desc };
    });
    return this;
  }

  execute(): any[] {
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

  values(data: InferInsertModel<T> | InferInsertModel<T>[]): this {
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
        const values = Object.values(row);
        this.db.insertRow(this.table.name, values as any[]);
    }
    return this;
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
    select: <T extends TableConfig>(table: Table<T>) => new SelectBuilder(db, table),
    insert: <T extends TableConfig>(table: Table<T>) => new InsertBuilder(db, table),
    update: <T extends TableConfig>(table: Table<T>, values: Partial<InferInsertModel<Table<T>>>) => new UpdateBuilder(db, table, values),
    delete: <T extends TableConfig>(table: Table<T>) => new DeleteBuilder(db, table),
  };
}
