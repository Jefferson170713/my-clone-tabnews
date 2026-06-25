import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const dataBaseVersionResult = await database.query("SHOW server_version;");
  const dataBaseResulValue = dataBaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionValue = parseInt(
    databaseMaxConnectionsResult.rows[0].max_connections,
  );

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnection = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpendConnectionValue = databaseOpenedConnection.rows[0].count;
  // const pgStatdatabase = await database.query("SELECT * FROM pg_stat_database;");
  const environmentVariable = process.env.NODE_ENV;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dataBaseResulValue,
        max_connections: databaseMaxConnectionValue,
        opened_connections: databaseOpendConnectionValue,
      },
    },
    environmont_variable: environmentVariable,
  });
}
export default status;
