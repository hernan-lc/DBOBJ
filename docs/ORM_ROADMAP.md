# ORM Roadmap for DBOBJ

To build a high-performance, Drizzle-like ORM for DBOBJ that bypasses the SQL parser for maximum efficiency, we have identified the following requirements and development phases.

## Phase 1: Core API Enhancement (Current)
*   **Structured Query API**: Expose a direct API in `dbobj-napi` that accepts an expression tree (as a JSON object) instead of a SQL string.
    *   This bypasses the `dbobj-sql` parser entirely, reducing CPU overhead and latency.
    *   Directly targets the `dbobj::Expr` evaluation engine.
*   **JSON-to-Expr Translation**: Implement efficient conversion from JavaScript query objects to Rust internal expression structures.

## Phase 2: TypeScript Schema Definition
*   **Table Schema Builder**: Create a TypeScript DSL to define tables, columns, and relations (similar to `pgTable`, `mysqlTable`).
    *   ```typescript
        const users = table("users", {
          id: integer("id").primaryKey(),
          name: string("name").notNull(),
          age: integer("age")
        });
        ```
*   **Automatic DDL**: Generate `db.createTable` calls directly from the TypeScript schema.
*   **Type Inference**: Use TypeScript's `InferSelectModel` and `InferInsertModel` to provide end-to-end type safety.

## Phase 3: Type-Safe Query Builder
*   **Fluent Query Interface**: Build a `select`, `from`, `where` chain that generates the structured JSON expression tree.
    *   ```typescript
        const result = await db.select()
          .from(users)
          .where(and(eq(users.name, "Alice"), gt(users.age, 20)))
          .execute();
        ```
*   **Direct Mapping**: Map the fluent calls directly to the N-API `select` method implemented in Phase 1.

## Phase 4: Performance Optimization
*   **Prepared Structured Queries**: Allow pre-compiling the expression tree and binding parameters at runtime for repeated execution.
*   **Zero-Copy Result Handling**: Ensure the query results are returned to the JS environment with minimal cloning.

## Phase 5: Migrations & Tooling
*   **Schema Introspection**: Ability to read existing DBOBJ files and generate TypeScript schemas.
*   **Migration Generator**: Compare schema definitions and generate DDL changes.
