// orm.ts
function table(name, columns) {
  const cols = {};
  for (const key in columns) {
    cols[key] = { name: columns[key] };
  }
  return { name, columns: cols };
}
var eq = (col, val) => ({
  op: "eq",
  left: { column: col.name },
  right: { literal: val }
});
var gt = (col, val) => ({
  op: "gt",
  left: { column: col.name },
  right: { literal: val }
});
var gte = (col, val) => ({
  op: "gte",
  left: { column: col.name },
  right: { literal: val }
});
var lt = (col, val) => ({
  op: "lt",
  left: { column: col.name },
  right: { literal: val }
});
var lte = (col, val) => ({
  op: "lte",
  left: { column: col.name },
  right: { literal: val }
});
var neq = (col, val) => ({
  op: "neq",
  left: { column: col.name },
  right: { literal: val }
});
var and = (...exprs) => {
  if (exprs.length === 0)
    throw new Error("and() requires at least one expression");
  if (exprs.length === 1)
    return exprs[0];
  return exprs.reduce((acc, curr) => ({
    op: "and",
    left: acc,
    right: curr
  }));
};
var or = (...exprs) => {
  if (exprs.length === 0)
    throw new Error("or() requires at least one expression");
  if (exprs.length === 1)
    return exprs[0];
  return exprs.reduce((acc, curr) => ({
    op: "or",
    left: acc,
    right: curr
  }));
};

class SelectBuilder {
  db;
  table;
  _where;
  _limit;
  _offset;
  _columns;
  constructor(db, table2) {
    this.db = db;
    this.table = table2;
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
  execute() {
    return this.db.select(this.table.name, this._where, this._columns, this._limit, this._offset);
  }
}

class UpdateBuilder {
  db;
  table;
  values;
  _where;
  constructor(db, table2, values) {
    this.db = db;
    this.table = table2;
    this.values = values;
  }
  where(expr) {
    this._where = expr;
    return this;
  }
  execute() {
    if (!this._where)
      throw new Error("update structured requires a where clause");
    return this.db.updateStructured(this.table.name, this._where, this.values);
  }
}

class DeleteBuilder {
  db;
  table;
  _where;
  constructor(db, table2) {
    this.db = db;
    this.table = table2;
  }
  where(expr) {
    this._where = expr;
    return this;
  }
  execute() {
    if (!this._where)
      throw new Error("delete structured requires a where clause");
    return this.db.deleteStructured(this.table.name, this._where);
  }
}
function createOrm(db) {
  return {
    select: (table2) => new SelectBuilder(db, table2),
    update: (table2, values) => new UpdateBuilder(db, table2, values),
    delete: (table2) => new DeleteBuilder(db, table2)
  };
}
export {
  table,
  or,
  neq,
  lte,
  lt,
  gte,
  gt,
  eq,
  createOrm,
  and
};
