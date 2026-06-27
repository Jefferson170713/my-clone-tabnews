import { runner as migrationRunner } from 'node-pg-migrate';
// import migrationRunner from 'node-pg-migrate';
import { join } from 'node:path'

export default async function migrations(request, response) {
  const migrationss = await migrationRunner({
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: 'up',
    verbose: true,
    migrationsTable: 'pgmigrations',
  });
  response.status(200).json(migrationss)
}