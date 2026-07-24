import database from "infra/database.js";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("POST to api/v1/migrations shold return 200", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response1.status).toBe(201);

  const responseBody1 = await response1.json();
  expect(Array.isArray(responseBody1)).toBe(true);
  expect(responseBody1.length).toBeGreaterThan(0);
  console.log(responseBody1);

  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const responseBody2 = await response2.json();
  expect(Array.isArray(responseBody2)).toBe(true);
  expect(responseBody2.length).toBe(0);
  console.log(responseBody2);

  const response3 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response3.status).toBe(200);

  const responseBody3 = await response3.json();
  expect(Array.isArray(responseBody3)).toBe(true);
  expect(responseBody3.length).toBe(0);
  console.log(responseBody3);
});
