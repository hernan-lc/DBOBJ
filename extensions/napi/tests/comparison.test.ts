import { expect, test } from "bun:test";
const { Database, DataType, table, eq, gt, and, createOrm } = require("../index.js");
import { Database as BunSqlite } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

test("Syntax Comparison: DBOBJ ORM vs Drizzle ORM", () => {
  // --- DBOBJ ---
  const dbobjDb = new Database(":memory:");
  dbobjDb.createTable("users", [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "age", dataType: DataType.Integer },
  ]);
  const users = table("users", {
    id: "id",
    name: "name",
    age: "age"
  });
  const db = createOrm(dbobjDb);

  // --- Drizzle ---
  const sqlite = new BunSqlite(":memory:");
  sqlite.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
  const drizzleDb = drizzle(sqlite);
  const dUsers = sqliteTable("users", {
    id: integer("id").primaryKey(),
    name: text("name"),
    age: integer("age"),
  });

  // --- Comparison ---

  // Select
  const dbobjQuery = db.select(users).where(gt(users.columns.age, 21));
  const drizzleQuery = drizzleDb.select().from(dUsers).where(gt(dUsers.age, 21));

  console.log("DBOBJ Query (Structured):", JSON.stringify(dbobjQuery));
  // Drizzle query is an object that would generate SQL.

  expect(typeof dbobjQuery.execute).toBe("function");
  expect(typeof drizzleQuery.all).toBe("function");
});
