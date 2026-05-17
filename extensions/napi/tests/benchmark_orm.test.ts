import { expect, test } from "bun:test";
const {
  Database,
  DataType,
  sqliteTable,
  integer,
  text,
  createOrm,
  eq,
  and
} = require("../index.js");
import { Database as BunSqlite } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable as drizzleTable, integer as dInt, text as dText } from "drizzle-orm/sqlite-core";

test("Benchmark: DBOBJ Join vs Drizzle SQL Join", () => {
  const COUNT = 1000;

  // --- DBOBJ Setup ---
  const dbobjDb = new Database(":memory:");
  dbobjDb.createTable("users", [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
  ]);
  dbobjDb.createTable("posts", [
    { name: "id", dataType: DataType.Integer },
    { name: "userId", dataType: DataType.Integer },
    { name: "title", dataType: DataType.String },
  ]);
  const users = sqliteTable("users", { id: integer("id").primaryKey(), name: text("name") });
  const posts = sqliteTable("posts", { id: integer("id").primaryKey(), userId: integer("userId"), title: text("title") });
  const dbobj = createOrm(dbobjDb);

  // --- Bun SQLite + Drizzle Setup ---
  const sqlite = new BunSqlite(":memory:");
  sqlite.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
  sqlite.run("CREATE TABLE posts (id INTEGER PRIMARY KEY, userId INTEGER, title TEXT)");
  const drizzleDb = drizzle(sqlite);
  const dUsers = drizzleTable("users", { id: dInt("id").primaryKey(), name: dText("name") });
  const dPosts = drizzleTable("posts", { id: dInt("id").primaryKey(), userId: dInt("userId"), title: dText("title") });

  // Data Ingestion
  for (let i = 0; i < COUNT; i++) {
    dbobjDb.insertRow("users", [i, `User ${i}`]);
    dbobjDb.insertRow("posts", [i, i % 100, `Post ${i}`]);
    sqlite.run("INSERT INTO users (id, name) VALUES (?, ?)", [i, `User ${i}`]);
    sqlite.run("INSERT INTO posts (id, userId, title) VALUES (?, ?, ?)", [i, i % 100, `Post ${i}`]);
  }

  const RUNS = 50;

  // DBOBJ Structured Join
  const startDbobj = performance.now();
  for (let i = 0; i < RUNS; i++) {
    dbobj.select(users)
      .innerJoin(posts, users.columns.id, posts.columns.userId)
      .where(eq(users.columns.id, 50))
      .execute();
  }
  const endDbobj = performance.now();

  // Drizzle SQL Join
  const startDrizzle = performance.now();
  for (let i = 0; i < RUNS; i++) {
    // Note: this generates a SQL string every time
    drizzleDb.select().from(dUsers)
      .innerJoin(dPosts, eq(dUsers.id, dPosts.userId))
      .where(eq(dUsers.id, 50))
      .all();
  }
  const endDrizzle = performance.now();

  console.log(`\n  Join Performance (${COUNT} rows, ${RUNS} iterations):`);
  console.log(`    DBOBJ Structured Join: ${(endDbobj - startDbobj).toFixed(2)}ms`);
  console.log(`    Drizzle SQL Join:      ${(endDrizzle - startDrizzle).toFixed(2)}ms`);

  expect(endDbobj - startDbobj).toBeLessThan(1000);
});
