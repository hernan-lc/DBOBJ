import { expect, test } from "bun:test";
const { Database, DataType } = require("../index.js");

test("Structured query select", () => {
  const db = new Database(":memory:");
  db.createTable("users", [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "age", dataType: DataType.Integer },
  ]);

  db.insertRow("users", [1, "Alice", 30]);
  db.insertRow("users", [2, "Bob", 25]);
  db.insertRow("users", [3, "Charlie", 35]);

  // Query: age > 28
  const query = {
    op: "gt",
    left: { column: "age" },
    right: { literal: 28 }
  };

  const results = db.select("users", query);
  expect(results.length).toBe(2);
  expect(results.map(r => r.name).sort()).toEqual(["Alice", "Charlie"]);

  // Query: name == "Bob"
  const query2 = {
    op: "eq",
    left: { column: "name" },
    right: { literal: "Bob" }
  };
  const results2 = db.select("users", query2);
  expect(results2.length).toBe(1);
  expect(results2[0].name).toBe("Bob");

  // Query: age > 30 AND name == "Charlie"
  const query3 = {
    op: "and",
    left: { op: "gt", left: { column: "age" }, right: { literal: 30 } },
    right: { op: "eq", left: { column: "name" }, right: { literal: "Charlie" } }
  };
  const results3 = db.select("users", query3);
  expect(results3.length).toBe(1);
  expect(results3[0].name).toBe("Charlie");
});
