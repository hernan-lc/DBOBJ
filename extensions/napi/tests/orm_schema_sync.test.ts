import { expect, test } from "bun:test";
const {
  Database,
  sqliteTable,
  integer,
  text,
  createOrm
} = require("../index.js");

test("ORM Schema Sync: createTable from ORM Table object", () => {
  const db = new Database(":memory:");
  const orm = createOrm(db);

  // Define ORM schema
  const users = sqliteTable("users_sync", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age")
  });

  // Use ORM schema to create DB table (no repetition)
  const created = db.createTable(users);
  expect(created).toBe(true);

  // Verify by inserting data
  db.insertRow("users_sync", [0, "Synced User", 42]);

  const results = orm.select(users).execute();
  expect(results.length).toBe(1);
  expect(results[0].name).toBe("Synced User");
  expect(results[0].age).toBe(42);
});
