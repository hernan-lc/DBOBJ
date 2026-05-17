import { expect, test } from "bun:test";
const {
  Database,
  DataType,
  sqliteTable,
  integer,
  text,
  boolean,
  eq,
  gt,
  and,
  or,
  not,
  isNotNull,
  createOrm,
  createRelationalApi
} = require("../index.js");

test("Modular ORM: Schema and Select", () => {
  const db = new Database(":memory:");

  const users = sqliteTable("users", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age"),
    active: boolean("active")
  });

  db.createTable(users);

  db.insertRow("users", [0, "Alice", 30, true]);
  db.insertRow("users", [1, "Bob", 25, true]);
  db.insertRow("users", [2, "Charlie", 35, false]);

  const orm = createOrm(db);

  // Simple Select
  const res1 = orm.select(users).where(eq(users.columns.name, "Alice")).execute();
  expect(res1.length).toBe(1);
  expect(res1[0].name).toBe("Alice");

  // Complex Where
  const res2 = orm.select(users)
    .where(and(gt(users.columns.age, 20), eq(users.columns.active, true)))
    .execute();
  expect(res2.length).toBe(2);

  // Order By
  const res3 = orm.select(users)
    .orderBy({ column: users.columns.age, desc: true })
    .execute();
  expect(res3[0].age).toBe(35);
  expect(res3[2].age).toBe(25);

  // Limit / Offset
  const res4 = orm.select(users).limit(1).offset(1).execute();
  expect(res4.length).toBe(1);
  expect(res4[0].id).toBe(1);
});

test("Modular ORM: Update and Delete", () => {
  const db = new Database(":memory:");
  const posts = sqliteTable("posts", {
    title: text("title")
  });
  db.createTable(posts);

  db.insertRow("posts", ["Post 1"]); // ID 0
  db.insertRow("posts", ["Post 2"]); // ID 1

  const orm = createOrm(db);

  // Update
  const updated = orm.update(posts, { title: "Updated Post 2" })
    .where(eq({ name: "id" } as any, 1))
    .execute();
  expect(updated).toBe(1);
  expect(db.getRowById("posts", 1).title).toBe("Updated Post 2");

  // Delete
  const deleted = orm.delete(posts).where(eq({ name: "id" } as any, 0)).execute();
  expect(deleted).toBe(1);
  expect(db.countRows("posts")).toBe(1);
});

test("Modular ORM: Relational API", () => {
  const db = new Database(":memory:");
  const products = sqliteTable("products", {
    price: integer("price")
  });
  db.createTable(products);

  db.insertRow("products", [100]); // ID 0
  db.insertRow("products", [200]); // ID 1

  const query = createRelationalApi(db, { products });

  const all = query.products.findMany({ where: gt(products.columns.price, 50) });
  expect(all.length).toBe(2);

  const first = query.products.findFirst({ where: eq({ name: "id" } as any, 1) });
  expect(first.price).toBe(200);
});
