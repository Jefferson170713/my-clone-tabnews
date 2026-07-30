const fs = require("node:fs");
const path = require("node:path");

function getMigrationFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(dir, file));
}

test("all migration files should be loadable as CommonJS", () => {
  const migrationsDir = path.join(process.cwd(), "infra/migrations");

  for (const migrationPath of getMigrationFiles(migrationsDir)) {
    const migrationModule = require(migrationPath);

    expect(migrationModule.shorthands).toBeUndefined();
    expect(typeof migrationModule.up).toBe("function");
    expect(typeof migrationModule.down).toBe("function");
  }
});

test("new migration files should default to CommonJS syntax", () => {
  const templatePath = path.join(process.cwd(), "infra/migrations/template.js");
  const templateContent = fs.readFileSync(templatePath, "utf8");

  expect(templateContent).toContain("module.exports");
  expect(templateContent).not.toContain("export const");
});
