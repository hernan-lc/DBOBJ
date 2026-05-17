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
  relations,
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

  // Define relations
  relations(users, ({ many }) => ({
    posts: many(posts)
  }));

  // --- Database Setup (Synced from ORM) ---
  db.createTable(users);
  db.createTable(posts);

  // --- Data Ingestion ---
  db.insertRow("users", [0, "Alice", 30, true]);
  db.insertRow("users", [1, "Bob", 25, true]);
  db.insertRow("users", [2, "Charlie", 35, false]);

  const postIds = orm.insert(posts).values([
    { userId: 0, title: "Post A1" },
    { userId: 0, title: "Post A2" },
    { userId: 1, title: "Post B1" }
  ]);
  expect(postIds.length).toBe(3);

  // --- 1. Aggregations ---
  expect(orm.select(users).count()).toBe(3);
  expect(orm.select(users).sum(users.columns.age)).toBe(90);
  expect(orm.select(users).avg(users.columns.age)).toBe(30);
  expect(orm.select(users).min(users.columns.age)).toBe(25);
  expect(orm.select(users).max(users.columns.age)).toBe(35);

  // --- 2. Membership & Range ---
  expect(orm.select(users).where(inArray(users.columns.id, [0, 2])).count()).toBe(2);
  expect(orm.select(users).where(between(users.columns.age, 20, 30)).count()).toBe(2);

  // --- 3. Joins (Inner & Left) ---
  const innerJoined = orm.select(users)
    .innerJoin(posts, users.columns.id, posts.columns.userId)
    .execute();
  expect(innerJoined.length).toBe(3);

  const leftJoined = orm.select(users)
    .leftJoin(posts, users.columns.id, posts.columns.userId)
    .execute();
  // Charlie (ID 2) has no posts, but should appear in left join
  expect(leftJoined.length).toBe(4); // Alice(2) + Bob(1) + Charlie(1)
  const charlieRow = leftJoined.find(r => r["users.name"] === "Charlie");
  expect(charlieRow["posts.title"]).toBeNull();

  // --- 4. Advanced Relational API ---
  const query = createRelationalApi(db, { users, posts });
  const usersWithPosts = query.users.findMany({
    where: eq(users.columns.id, 0),
    with: {
        posts: { limit: 1 }
    }
  });

  expect(usersWithPosts.length).toBe(1);
  expect(usersWithPosts[0].posts.length).toBe(1);

  // --- 5. Logical negation ---
  expect(orm.select(users).where(not(eq(users.columns.active, true))).count()).toBe(1); // Charlie
});
