import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const dataBaseVersionResult = await database.query("SHOW server_version;");
  const dataBaseVersionResult_ = await database.query("select version();");
  console.log("Aqui: ", dataBaseVersionResult_.rowCount);

  const dataBaseResulValue = dataBaseVersionResult.rows[0].server_version;
  console.log("Aqui: ", dataBaseResulValue);

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dataBaseResulValue,
      },
    },
  });
}
export default status;
