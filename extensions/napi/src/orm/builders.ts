import { Table, Column, TableConfig, DataType } from "./schema";

export type InferSelectModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id: number };

export type InferInsertModel<T extends Table<any>> = {
  [K in keyof T["columns"]]: T["columns"][K]["_type"];
} & { id?: number };

export class SelectBuilder<T extends Table<any>> {
  private _where?: any;
  private _limit?: number;
  private _offset?: number;
  private _columns?: string[];
  private _orderBy?: Array<{ column: string; desc?: boolean }>;

  constructor(private db: any, private table: T) {}

  where(expr: any) {
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

  orderBy(...orders: Array<Column | { column: Column; desc?: boolean }>) {
    this._orderBy = orders.map(o => {
      if ("name" in o) return { column: o.name };
      return { column: (o.column as any).name, desc: o.desc };
    });
    return this;
  }

  execute(): InferSelectModel<T>[] {
    return this.db.select(
      this.table.name,
      this._where || null,
      this._columns || null,
      this._orderBy || null,
      this._limit || null,
      this._offset || null
    ) as InferSelectModel<T>[];
  }
}

export class InsertBuilder<T extends Table<any>> {
  constructor(private db: any, private table: T) {}

  values(data: InferInsertModel<T> | InferInsertModel<T>[]) {
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
        const values = Object.values(row);
        this.db.insertRow(this.table.name, values);
    }
    return this;
  }
}

export class UpdateBuilder<T extends Table<any>> {
  private _where?: any;

  constructor(private db: any, private table: T, private values: Partial<InferInsertModel<T>>) {}

  where(expr: any) {
    this._where = expr;
    return this;
  }

  execute() {
    if (!this._where) throw new Error("Update requires a where clause");
    return this.db.updateStructured(this.table.name, this._where, this.values as any);
  }
}

export class DeleteBuilder<T extends Table<any>> {
  private _where?: any;

  constructor(private db: any, private table: T) {}

  where(expr: any) {
    this._where = expr;
    return this;
  }

  execute() {
    if (!this._where) throw new Error("Delete requires a where clause");
    return this.db.deleteStructured(this.table.name, this._where);
  }
}

export function createOrm(db: any) {
  return {
    select: (table: Table<any>) => new SelectBuilder(db, table),
    insert: (table: Table<any>) => new InsertBuilder(db, table),
    update: (table: Table<any>, values: any) => new UpdateBuilder(db, table, values),
    delete: (table: Table<any>) => new DeleteBuilder(db, table),
  };
}
