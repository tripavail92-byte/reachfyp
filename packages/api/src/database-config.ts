import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ReachfypDatabaseProvider = "sqlite" | "postgres";

const packageDirectory = dirname(fileURLToPath(import.meta.url));
const defaultSqliteDatabasePath = join(packageDirectory, "..", "data", "creator-records.sqlite");

export function getReachfypDatabaseProvider(): ReachfypDatabaseProvider {
  return process.env.DATABASE_PROVIDER?.trim().toLowerCase() === "postgres" ? "postgres" : "sqlite";
}

export function getReachfypDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() ?? "";
}

export function getReachfypSqliteDatabasePath() {
  const configuredPath = process.env.SQLITE_DATABASE_PATH?.trim();
  return configuredPath ? resolve(configuredPath) : defaultSqliteDatabasePath;
}

export function getReachfypDatabaseConfig() {
  return {
    provider: getReachfypDatabaseProvider(),
    databaseUrl: getReachfypDatabaseUrl(),
    sqliteDatabasePath: getReachfypSqliteDatabasePath(),
  } as const;
}