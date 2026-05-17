import { Table } from "./schema";
import { SelectBuilder, InferSelectModel } from "./builders";
import { Database, QueryExpr } from "../../index.d";

export class RelationalQueryBuilder<T extends Table<any>> {
  constructor(private db: Database, private table: T) {}

  findMany(options?: {
    where?: QueryExpr,
    limit?: number,
    offset?: number,
    orderBy?: Array<any>,
    with?: Record<string, boolean | { where?: QueryExpr, limit?: number }>
  }): any[] {
    let builder = new SelectBuilder(this.db, this.table);
    if (options?.where) builder.where(options.where);
    if (options?.limit) builder.limit(options.limit);
    if (options?.offset) builder.offset(options.offset);

    const results = builder.execute();

    if (options?.with) {
        for (const relationName in options.with) {
            const relationConfig = options.with[relationName];
            const relationTable = (this as any)._relations?.[relationName];
            if (relationTable) {
                for (const row of results) {
                    const relatedBuilder = new SelectBuilder(this.db, relationTable);

                    const foreignKeyCol = (this as any)._foreignKeys?.[relationName] || "userId";
                    let filter: QueryExpr = { op: "eq", left: { column: foreignKeyCol }, right: { literal: row.id } };

                    if (typeof relationConfig === "object" && relationConfig.where) {
                        filter = { op: "and", left: filter, right: relationConfig.where };
                    }
                    relatedBuilder.where(filter);

                    if (typeof relationConfig === "object" && relationConfig.limit) {
                        relatedBuilder.limit(relationConfig.limit);
                    }

                    row[relationName] = relatedBuilder.execute();
                }
            }
        }
    }

    return results;
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
