import { Table } from "./schema";
import { SelectBuilder, InferSelectModel } from "./builders";

export class RelationalQueryBuilder<T extends Table<any>> {
  constructor(private db: any, private table: T) {}

  findMany(options?: {
    where?: any,
    limit?: number,
    offset?: number,
    orderBy?: any
  }): InferSelectModel<T>[] {
    let builder = new SelectBuilder(this.db, this.table);
    if (options?.where) builder.where(options.where);
    if (options?.limit) builder.limit(options.limit);
    if (options?.offset) builder.offset(options.offset);
    return builder.execute();
  }

  findFirst(options?: { where?: any }): InferSelectModel<T> | null {
    const results = this.findMany({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
}

export function createRelationalApi(db: any, tables: Record<string, Table<any>>) {
  const query: any = {};
  for (const key in tables) {
    query[key] = new RelationalQueryBuilder(db, tables[key]);
  }
  return query;
}
