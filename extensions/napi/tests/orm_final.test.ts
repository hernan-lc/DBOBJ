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
  and,
  or,
  not,
  isNotNull,
  inArray,
  between,
  createOrm,
  createRelationalApi
} = require("../index.js");

test("Final Comprehensive Relational ORM Test", () => {
  const db = new Database(":memory:");
  const orm = createOrm(db);

  // --- Schema Definition ---
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

  const comments = sqliteTable("comments", {
    id: integer("id").primaryKey(),
    postId: integer("postId"),
    userId: integer("userId"),
    content: text("content")
  });

  // --- Database Setup ---
  db.createTable("users", [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "age", dataType: DataType.Integer },
    { name: "active", dataType: DataType.Boolean },
  ]);
  db.createTable("posts", [
    { name: "id", dataType: DataType.Integer },
    { name: "userId", dataType: DataType.Integer },
    { name: "title", dataType: DataType.String },
  ]);
  db.createTable("comments", [
    { name: "id", dataType: DataType.Integer },
    { name: "postId", dataType: DataType.Integer },
    { name: "userId", dataType: DataType.Integer },
    { name: "content", dataType: DataType.String },
  ]);

  // --- Data Ingestion ---
  db.insertRow("users", [0, "Alice", 30, true]);
  db.insertRow("users", [1, "Bob", 25, true]);
  db.insertRow("users", [2, "Charlie", 35, false]);

  db.insertRow("posts", [0, 0, "Post A1"]); // Alice
  db.insertRow("posts", [1, 0, "Post A2"]); // Alice
  db.insertRow("posts", [2, 1, "Post B1"]); // Bob

  db.insertRow("comments", [0, 0, 0, "C1"]); // Post 0, User 0
  db.insertRow("comments", [1, 0, 1, "C2"]); // Post 0, User 1

  // --- 1. inArray & between ---
  expect(orm.select(users).where(inArray(users.columns.id, [0, 2])).count()).toBe(2);
  expect(orm.select(users).where(between(users.columns.age, 20, 30)).count()).toBe(2);

  // --- 2. Multiple Joins (Structured) ---
  // Select users joined with posts and comments
  const complexJoined = orm.select(users)
    .innerJoin(posts, users.columns.id, posts.columns.userId)
    .where(and(eq(users.columns.id, 0), gt(posts.columns.id, -1)))
    .execute();

  expect(complexJoined.length).toBe(2); // Alice has 2 posts
  expect(complexJoined[0]["posts.title"]).toBeDefined();

  // --- 3. Advanced Relational API (findMany with with) ---
  const query = createRelationalApi(db, { users, posts });
  (query.users as any)._relations = { posts: posts };
  (query.users as any)._foreignKeys = { posts: "userId" };

  const usersWithPosts = query.users.findMany({
    where: eq(users.columns.id, 0),
    with: {
        posts: {
            where: gt(posts.columns.id, 0),
            limit: 1
        }
    }
  });

  expect(usersWithPosts.length).toBe(1);
  expect(usersWithPosts[0].posts.length).toBe(1);
  expect(usersWithPosts[0].posts[0].id).toBe(1); // Post A2

  // --- 4. Logical negation (not) ---
  expect(orm.select(users).where(not(eq(users.columns.active, true))).count()).toBe(1); // Charlie
});
