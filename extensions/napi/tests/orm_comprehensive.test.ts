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
  lt,
  lte,
  and,
  or,
  not,
  isNull,
  isNotNull,
  like,
  createOrm
} = require("../index.js");

test("Comprehensive Relational ORM Test", () => {
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
    content: text("content")
  });

  // --- Database Setup (Synced from ORM) ---
  db.createTable(users);
  db.createTable(posts);
  db.createTable(comments);

  // --- Data Ingestion ---
  db.insertRow("users", [0, "Alice", 30, true]);
  db.insertRow("users", [1, "Bob", 25, true]);
  db.insertRow("users", [2, "Charlie", 35, false]);

  db.insertRow("posts", [0, 0, "Alice's Post"]); // User 0
  db.insertRow("posts", [1, 1, "Bob's Post"]);   // User 1
  db.insertRow("posts", [2, 0, "Alice's Second Post"]);

  db.insertRow("comments", [0, 0, "Great post!"]); // Post 0
  db.insertRow("comments", [1, 0, "Thanks!"]);     // Post 0
  db.insertRow("comments", [2, 1, "Nice one."]);   // Post 1

  // --- 1. Basic Operators ---
  expect(orm.select(users).where(ne(users.columns.name, "Alice")).count()).toBe(2);
  expect(orm.select(users).where(gt(users.columns.age, 30)).count()).toBe(1);
  expect(orm.select(users).where(gte(users.columns.age, 30)).count()).toBe(2);
  expect(orm.select(users).where(lt(users.columns.age, 30)).count()).toBe(1);
  expect(orm.select(users).where(lte(users.columns.age, 30)).count()).toBe(2);
  expect(orm.select(users).where(like(users.columns.name, "A%")).count()).toBe(1);
  expect(orm.select(users).where(isNull(users.columns.active)).count()).toBe(0);
  expect(orm.select(users).where(isNotNull(users.columns.active)).count()).toBe(3);

  // --- 2. Logical Operators ---
  const complex = orm.select(users).where(
    and(
      or(eq(users.columns.name, "Alice"), eq(users.columns.name, "Bob")),
      gt(users.columns.age, 20),
      not(eq(users.columns.active, false))
    )
  ).execute();
  expect(complex.length).toBe(2);

  // --- 3. Joins ---
  const joined = orm.select(users)
    .innerJoin(posts, users.columns.id, posts.columns.userId)
    .where(eq(users.columns.name, "Alice"))
    .execute();

  // Results have prefixed keys: users.id, posts.title, etc.
  expect(joined.length).toBe(2);
  expect(joined[0]["posts.title"]).toContain("Alice");

  // --- 4. Combined Features (OrderBy, Limit, Offset) ---
  const paginated = orm.select(users)
    .orderBy({ column: users.columns.age, desc: true })
    .limit(2)
    .offset(1)
    .execute();

  expect(paginated.length).toBe(2);
  expect(paginated[0].name).toBe("Alice"); // Ages: 35, 30, 25. Offset 1 -> 30 (Alice)
  expect(paginated[1].name).toBe("Bob");   // 25 (Bob)

  // --- 5. Count with filter ---
  const count = orm.select(posts).where(eq(posts.columns.userId, 0)).count();
  expect(count).toBe(2);
});
