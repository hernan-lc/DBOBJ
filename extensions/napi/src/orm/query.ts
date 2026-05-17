import { Table } from "./schema";
import { SelectBuilder, InferSelectModel } from "./builders";
import { Database, QueryExpr } from "../../index.d";

export class RelationalQueryBuilder<T extends Table<any>> {
  constructor(private db: Database, private table: T) {}

  findMany(options?: {
    where?: QueryExpr,
    limit?: number,
    offset?: number,
    orderBy?: Array<any> // Will be improved when OrderBy types are modularized
  }): InferSelectModel<T>[] {
    let builder = new SelectBuilder(this.db, this.table);
    if (options?.where) builder.where(options.where);
    if (options?.limit) builder.limit(options.limit);
    if (options?.offset) builder.offset(options.offset);
    return builder.execute();
  }

  findFirst(options?: { where?: QueryExpr }): InferSelectModel<T> | null {
    const results = this.findMany({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
}

export function createRelationalApi(db: Database, tables: Record<string, Table<any>>) {
  const query: Record<string, RelationalQueryBuilder<Table<any>>> = {};
  for (const key in tables) {
    query[key] = new RelationalQueryBuilder(db, tables[key]);
  }
  return query;
}
