import { expect, test } from "bun:test";
const {
  Database,
  DataType,
  sqliteTable,
  integer,
  text,
  boolean,
  eq,
  ne,
  gt,
  gte,
  and,
  or,
  not,
  isNull,
  isNotNull,
  like,
  inArray,
  notInArray,
  between,
  notBetween,
  relations,
  createOrm,
  createRelationalApi
} = require("../index.js");

test("Advanced ORM Operations", () => {
  const db = new Database(":memory:");
  const orm = createOrm(db);

  const users = sqliteTable("users", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age"),
    active: boolean("active")
  });

  const posts = sqliteTable("posts", {
    id: integer("id").primaryKey(),
    userId: integer("userId"),
    title: text("title")
  });

  relations(users, ({ many }) => ({
    posts: many(posts)
  }));

  db.createTable(users);
  db.createTable(posts);

  db.insertRow("users", [0, "Alice", 30, true]);
  db.insertRow("users", [1, "Bob", 25, true]);
  db.insertRow("users", [2, "Charlie", 35, false]);

  db.insertRow("posts", [0, 0, "A1"]);
  db.insertRow("posts", [1, 0, "A2"]);
  db.insertRow("posts", [2, 1, "B1"]);

  // Membership & Range tests
  expect(orm.select(users).where(inArray(users.columns.id, [0, 2])).count()).toBe(2);
  expect(orm.select(users).where(notInArray(users.columns.id, [0, 2])).count()).toBe(1);
  expect(orm.select(users).where(between(users.columns.age, 20, 30)).count()).toBe(2);
  expect(orm.select(users).where(notBetween(users.columns.age, 20, 30)).count()).toBe(1);

  // Logical & Nullability
  expect(orm.select(users).where(isNotNull(users.columns.age)).count()).toBe(3);
  expect(orm.select(users).where(and(eq(users.columns.active, true), gte(users.columns.age, 30))).count()).toBe(1);

  // Relational API with sorting and limits
  const query = createRelationalApi(db, { users, posts });

  const results = query.users.findMany({
    where: eq(users.columns.name, "Alice"),
    with: {
        posts: {
            limit: 1,
            orderBy: [{ column: "title", desc: true }]
        }
    }
  });

  expect(results.length).toBe(1);
  expect(results[0].posts.length).toBe(1);
  expect(results[0].posts[0].title).toBe("A2");
});
