const fs = require("node:fs");
const path = require("node:path");

test("migration file should be loadable as CommonJS", () => {
  const migrationModule = require("infra/migrations/1782527569138_teste-migration.js");

  expect(migrationModule.shorthands).toBeUndefined();
  expect(typeof migrationModule.up).toBe("function");
  expect(typeof migrationModule.down).toBe("function");
});

test("new migration files should default to CommonJS syntax", () => {
  const templatePath = path.join(process.cwd(), "infra/migrations/template.js");
  const templateContent = fs.readFileSync(templatePath, "utf8");

  expect(templateContent).toContain("module.exports");
  expect(templateContent).not.toContain("export const");
});
