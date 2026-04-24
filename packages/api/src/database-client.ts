import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg, { type PoolClient, type QueryResult } from "pg";
import { getReachfypDatabaseConfig } from "./database-config";
import { ensureReachfypBaseSchema } from "./database-schema";

const { Pool } = pg;

type QueryParams = Record<string, unknown> | unknown[] | undefined;

type QueryExecutor = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>;
};

type PooledQueryExecutor = QueryExecutor & {
  connect: () => Promise<PoolClient>;
};

export type ReachfypDatabaseProvider = "sqlite" | "postgres";

export type ReachfypRunResult = {
  changes: number;
};

export type ReachfypPreparedStatement = {
  get: <T>(params?: QueryParams) => Promise<T | undefined>;
  all: <T>(params?: QueryParams) => Promise<T[]>;
  run: (params?: QueryParams) => Promise<ReachfypRunResult>;
};

export type ReachfypDatabase = {
  provider: ReachfypDatabaseProvider;
  prepare: (sql: string) => ReachfypPreparedStatement;
  exec: (sql: string) => Promise<void>;
  transaction: <T>(callback: (database: ReachfypDatabase) => Promise<T>) => Promise<T>;
};

type CompiledSql = {
  sql: string;
  values: unknown[];
};

let sqliteDatabase: ReachfypDatabase | null = null;
let postgresDatabase: ReachfypDatabase | null = null;
let postgresPool: InstanceType<typeof Pool> | null = null;
let postgresSchemaReady: Promise<void> | null = null;

function normalizeQueryValue(value: unknown) {
  return value === undefined ? null : value;
}

function assertSafeIdentifier(identifier: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return identifier;
}

function compileSql(sql: string, params?: QueryParams): CompiledSql {
  if (!params) {
    return { sql, values: [] };
  }

  if (Array.isArray(params)) {
    let parameterIndex = 0;
    return {
      sql: sql.replace(/\?/g, () => {
        parameterIndex += 1;
        return `$${parameterIndex}`;
      }),
      values: params.map(normalizeQueryValue),
    };
  }

  const values: unknown[] = [];
  const namedValues = params;
  const compiledSql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key: string) => {
    values.push(normalizeQueryValue(namedValues[key]));
    return `$${values.length}`;
  });

  return {
    sql: compiledSql,
    values,
  };
}

function bindSqliteStatement(statement: ReturnType<DatabaseSync["prepare"]>): ReachfypPreparedStatement {
  function invokeSqliteStatement<T>(method: (...parameters: unknown[]) => T, params?: QueryParams) {
    if (params === undefined) {
      return method();
    }

    if (Array.isArray(params)) {
      return (method as (...parameters: unknown[]) => T)(...params);
    }

    return method(params);
  }

  return {
    async get<T>(params?: QueryParams) {
      return invokeSqliteStatement(statement.get.bind(statement) as (...parameters: unknown[]) => T | undefined, params);
    },
    async all<T>(params?: QueryParams) {
      return invokeSqliteStatement(statement.all.bind(statement) as (...parameters: unknown[]) => T[], params);
    },
    async run(params?: QueryParams) {
      const result = invokeSqliteStatement(statement.run.bind(statement) as (...parameters: unknown[]) => ReturnType<typeof statement.run>, params);
      return { changes: Number(result.changes) };
    },
  };
}

function createSqliteDatabase(database: DatabaseSync): ReachfypDatabase {
  return {
    provider: "sqlite",
    prepare(sql) {
      return bindSqliteStatement(database.prepare(sql));
    },
    async exec(sql) {
      database.exec(sql);
    },
    async transaction<T>(callback: (transactionDatabase: ReachfypDatabase) => Promise<T>) {
      database.exec("BEGIN");

      try {
        const result = await callback(createSqliteDatabase(database));
        database.exec("COMMIT");
        return result;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function createPostgresDatabase(executor: QueryExecutor): ReachfypDatabase {
  return {
    provider: "postgres",
    prepare(sql) {
      return {
        async get<T>(params?: QueryParams) {
          const compiled = compileSql(sql, params);
          const result = await executor.query(compiled.sql, compiled.values);
          return result.rows[0] as T | undefined;
        },
        async all<T>(params?: QueryParams) {
          const compiled = compileSql(sql, params);
          const result = await executor.query(compiled.sql, compiled.values);
          return result.rows as T[];
        },
        async run(params?: QueryParams) {
          const compiled = compileSql(sql, params);
          const result = await executor.query(compiled.sql, compiled.values);
          return { changes: result.rowCount ?? 0 };
        },
      };
    },
    async exec(sql) {
      await executor.query(sql);
    },
    async transaction<T>(callback: (transactionDatabase: ReachfypDatabase) => Promise<T>) {
      if (!("connect" in executor)) {
        throw new Error("Nested Postgres transactions must start from the pooled database handle.");
      }

      const pooledExecutor = executor as PooledQueryExecutor;
      const client = await pooledExecutor.connect();
      const transactionExecutor: QueryExecutor = {
        query(text, values) {
          return client.query(text, values).then((result: QueryResult) => ({ rows: result.rows, rowCount: result.rowCount }));
        },
      };

      await client.query("BEGIN");

      try {
        const result = await callback(createPostgresDatabase(transactionExecutor));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

async function getSqliteDatabase() {
  if (sqliteDatabase) {
    return sqliteDatabase;
  }

  const config = getReachfypDatabaseConfig();
  mkdirSync(dirname(config.sqliteDatabasePath), { recursive: true });
  const database = new DatabaseSync(config.sqliteDatabasePath);
  sqliteDatabase = createSqliteDatabase(database);
  await ensureReachfypBaseSchema(sqliteDatabase);
  return sqliteDatabase;
}

async function getPostgresDatabase() {
  if (!postgresPool) {
    const config = getReachfypDatabaseConfig();

    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL must be set when DATABASE_PROVIDER=postgres.");
    }

    postgresPool = new Pool({ connectionString: config.databaseUrl });
    const pooledExecutor: PooledQueryExecutor = {
      query(text, values) {
        return postgresPool!.query(text, values).then((result: QueryResult) => ({ rows: result.rows, rowCount: result.rowCount }));
      },
      connect() {
        return postgresPool!.connect();
      },
    };
    postgresDatabase = createPostgresDatabase(pooledExecutor);
  }

  if (!postgresDatabase) {
    throw new Error("Postgres database handle failed to initialize.");
  }

  postgresSchemaReady ??= ensureReachfypBaseSchema(postgresDatabase);
  await postgresSchemaReady;
  return postgresDatabase;
}

export async function getReachfypDatabaseClient() {
  const config = getReachfypDatabaseConfig();
  return config.provider === "postgres" ? getPostgresDatabase() : getSqliteDatabase();
}

export async function listTableColumns(database: ReachfypDatabase, tableName: string) {
  const safeTableName = assertSafeIdentifier(tableName);

  if (database.provider === "sqlite") {
    return database.prepare(`PRAGMA table_info(${safeTableName})`).all<{ name: string }>();
  }

  return database.prepare(
    "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? ORDER BY ordinal_position ASC",
  ).all<{ name: string }>([safeTableName]);
}

export async function tableExists(database: ReachfypDatabase, tableName: string) {
  const safeTableName = assertSafeIdentifier(tableName);

  if (database.provider === "sqlite") {
    const row = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1").get<{ name: string }>([safeTableName]);
    return Boolean(row);
  }

  const row = await database.prepare(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ? LIMIT 1",
  ).get<{ name: string }>([safeTableName]);
  return Boolean(row);
}