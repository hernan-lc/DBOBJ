var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/orm/index.ts
var exports_orm = {};
__export(exports_orm, {
  text: () => text,
  sqliteTable: () => sqliteTable,
  relations: () => relations,
  real: () => real,
  or: () => or,
  notInArray: () => notInArray,
  notBetween: () => notBetween,
  not: () => not,
  ne: () => ne,
  lte: () => lte,
  lt: () => lt,
  like: () => like,
  isNull: () => isNull,
  isNotNull: () => isNotNull,
  integer: () => integer,
  inArray: () => inArray,
  gte: () => gte,
  gt: () => gt,
  eq: () => eq,
  desc: () => desc,
  createRelationalApi: () => createRelationalApi,
  createOrm: () => createOrm,
  boolean: () => boolean,
  blob: () => blob,
  between: () => between,
  asc: () => asc,
  and: () => and,
  UpdateBuilder: () => UpdateBuilder,
  Table: () => Table,
  SelectBuilder: () => SelectBuilder,
  RelationalQueryBuilder: () => RelationalQueryBuilder,
  InsertBuilder: () => InsertBuilder,
  DeleteBuilder: () => DeleteBuilder,
  DataType: () => DataType
});
module.exports = __toCommonJS(exports_orm);

// src/orm/schema.ts
var DataType;
((DataType2) => {
  DataType2[DataType2["Integer"] = 0] = "Integer";
  DataType2[DataType2["Float"] = 1] = "Float";
  DataType2[DataType2["String"] = 2] = "String";
  DataType2[DataType2["Boolean"] = 3] = "Boolean";
  DataType2[DataType2["Blob"] = 4] = "Blob";
  DataType2[DataType2["Json"] = 5] = "Json";
  DataType2[DataType2["ArrayString"] = 6] = "ArrayString";
  DataType2[DataType2["ArrayI64"] = 7] = "ArrayI64";
  DataType2[DataType2["ArrayF64"] = 8] = "ArrayF64";
})(DataType ||= {});

class Table {
  name;
  columns;
  constructor(name, columns) {
    this.name = name;
    this.columns = columns;
  }
  getDefinitions() {
    return Object.values(this.columns).map((col) => ({
      name: col.name,
      dataType: col.type,
      nullable: !col.notNull
    }));
  }
}
function sqliteTable(name, columns) {
  return new Table(name, columns);
}
function integer(name) {
  const col = {
    name,
    type: 0 /* Integer */,
    _type: 0
  };
  col.primaryKey = () => ({ ...col, primaryKey: true });
  col.notNull = () => ({ ...col, notNull: true });
  return col;
}
function text(name) {
  const col = {
    name,
    type: 2 /* String */,
    _type: ""
  };
  col.notNull = () => ({ ...col, notNull: true });
  return col;
}
function boolean(name) {
  return { name, type: 3 /* Boolean */, _type: false };
}
function real(name) {
  return { name, type: 1 /* Float */, _type: 0 };
}
function blob(name) {
  return { name, type: 4 /* Blob */, _type: new Uint8Array };
}
function relations(table, relationsConfig) {
  const helpers = {
    one: (target, config) => ({
      target,
      type: "one",
      foreignKey: config?.fields[0]?.name
    }),
    many: (target) => ({
      target,
      type: "many"
    })
  };
  table._relations = relationsConfig(helpers);
  return table;
}
// src/orm/expressions.ts
function eq(col, val) {
  return { op: "eq", left: { column: col.name }, right: { literal: val } };
}
function ne(col, val) {
  return { op: "neq", left: { column: col.name }, right: { literal: val } };
}
function gt(col, val) {
  return { op: "gt", left: { column: col.name }, right: { literal: val } };
}
function gte(col, val) {
  return { op: "gte", left: { column: col.name }, right: { literal: val } };
}
function lt(col, val) {
  return { op: "lt", left: { column: col.name }, right: { literal: val } };
}
function lte(col, val) {
  return { op: "lte", left: { column: col.name }, right: { literal: val } };
}
function and(...exprs) {
  if (exprs.length === 0)
    throw new Error("and() requires at least one expression");
  if (exprs.length === 1)
    return exprs[0];
  return exprs.reduce((acc, curr) => ({ op: "and", left: acc, right: curr }));
}
function or(...exprs) {
  if (exprs.length === 0)
    throw new Error("or() requires at least one expression");
  if (exprs.length === 1)
    return exprs[0];
  return exprs.reduce((acc, curr) => ({ op: "or", left: acc, right: curr }));
}
function not(expr) {
  return { not: expr };
}
function isNull(col) {
  return { op: "eq", left: { column: col.name }, right: { literal: null } };
}
function isNotNull(col) {
  return { op: "neq", left: { column: col.name }, right: { literal: null } };
}
function like(col, pattern) {
  return { op: "like", left: { column: col.name }, right: { literal: pattern } };
}
function inArray(col, values) {
  return { op: "in", left: { column: col.name }, right: { literal: JSON.stringify(values) } };
}
function notInArray(col, values) {
  return { not: inArray(col, values) };
}
function between(col, min, max) {
  return and(gte(col, min), lte(col, max));
}
function notBetween(col, min, max) {
  return { not: between(col, min, max) };
}
function asc(col) {
  return { column: col.name, desc: false };
}
function desc(col) {
  return { column: col.name, desc: true };
}
// src/orm/builders.ts
class SelectBuilder {
  db;
  table;
  _where;
  _limit;
  _offset;
  _columns;
  _orderBy;
  _join;
  constructor(db, table) {
    this.db = db;
    this.table = table;
  }
  innerJoin(other, onLeft, onRight) {
    this._join = {
      table: other.name,
      onLeft: onLeft.name,
      onRight: onRight.name,
      type: "inner"
    };
    return this;
  }
  leftJoin(other, onLeft, onRight) {
    this._join = {
      table: other.name,
      onLeft: onLeft.name,
      onRight: onRight.name,
      type: "left"
    };
    return this;
  }
  where(expr) {
    this._where = expr;
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  offset(n) {
    this._offset = n;
    return this;
  }
  orderBy(...orders) {
    this._orderBy = orders.map((o) => {
      if ("name" in o)
        return { column: o.name };
      const ord = o;
      return { column: ord.column.name, desc: ord.desc };
    });
    return this;
  }
  count() {
    const results = this.db.select(this.table.name, this._where || null, ["id"], this._orderBy || null, this._join || null, null, null);
    return results.length;
  }
  sum(col) {
    const rows = this.execute();
    return rows.reduce((acc, row) => acc + (row[col.name] || 0), 0);
  }
  avg(col) {
    const rows = this.execute();
    if (rows.length === 0)
      return 0;
    return this.sum(col) / rows.length;
  }
  min(col) {
    const rows = this.execute();
    if (rows.length === 0)
      return null;
    return Math.min(...rows.map((r) => r[col.name]));
  }
  max(col) {
    const rows = this.execute();
    if (rows.length === 0)
      return null;
    return Math.max(...rows.map((r) => r[col.name]));
  }
  execute() {
    return this.db.select(this.table.name, this._where || null, this._columns || null, this._orderBy || null, this._join || null, this._limit || null, this._offset || null);
  }
}

class InsertBuilder {
  db;
  table;
  constructor(db, table) {
    this.db = db;
    this.table = table;
  }
  values(data) {
    const rows = Array.isArray(data) ? data : [data];
    const ids = [];
    for (const row of rows) {
      const values = [];
      for (const colName in this.table.columns) {
        const col = this.table.columns[colName];
        values.push(row[colName] ?? null);
      }
      const id = this.db.insertRow(this.table.name, values);
      ids.push(Number(id));
    }
    return ids;
  }
}

class UpdateBuilder {
  db;
  table;
  values;
  _where;
  constructor(db, table, values) {
    this.db = db;
    this.table = table;
    this.values = values;
  }
  where(expr) {
    this._where = expr;
    return this;
  }
  execute() {
    if (!this._where)
      throw new Error("Update requires a where clause");
    return this.db.updateStructured(this.table.name, this._where, this.values);
  }
}

class DeleteBuilder {
  db;
  table;
  _where;
  constructor(db, table) {
    this.db = db;
    this.table = table;
  }
  where(expr) {
    this._where = expr;
    return this;
  }
  execute() {
    if (!this._where)
      throw new Error("Delete requires a where clause");
    return this.db.deleteStructured(this.table.name, this._where);
  }
}
function createOrm(db) {
  return {
    select: (table) => new SelectBuilder(db, table),
    insert: (table) => new InsertBuilder(db, table),
    update: (table, values) => new UpdateBuilder(db, table, values),
    delete: (table) => new DeleteBuilder(db, table)
  };
}
// src/orm/query.ts
class RelationalQueryBuilder {
  db;
  table;
  constructor(db, table) {
    this.db = db;
    this.table = table;
  }
  findMany(options) {
    let builder = new SelectBuilder(this.db, this.table);
    if (options?.where)
      builder.where(options.where);
    if (options?.limit)
      builder.limit(options.limit);
    if (options?.offset)
      builder.offset(options.offset);
    const results = builder.execute();
    if (options?.with) {
      for (const relationName in options.with) {
        const relationConfig = options.with[relationName];
        const relation = this.table._relations?.[relationName];
        if (relation) {
          const relationTable = relation.target;
          for (const row of results) {
            const relatedBuilder = new SelectBuilder(this.db, relationTable);
            const foreignKeyCol = relation.foreignKey || "userId";
            let filter = { op: "eq", left: { column: foreignKeyCol }, right: { literal: row.id } };
            if (typeof relationConfig === "object" && relationConfig.where) {
              filter = { op: "and", left: filter, right: relationConfig.where };
            }
            relatedBuilder.where(filter);
            if (typeof relationConfig === "object") {
              if (relationConfig.limit)
                relatedBuilder.limit(relationConfig.limit);
              if (relationConfig.orderBy)
                relatedBuilder._orderBy = relationConfig.orderBy;
              if (relationConfig.columns)
                relatedBuilder._columns = relationConfig.columns;
            }
            row[relationName] = relatedBuilder.execute();
          }
        }
      }
    }
    return results;
  }
  findFirst(options) {
    const results = this.findMany({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
}
function createRelationalApi(db, tables) {
  const query = {};
  for (const key in tables) {
    query[key] = new RelationalQueryBuilder(db, tables[key]);
  }
  return query;
}
