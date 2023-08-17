// create biztime_test db and seed tables
// terminal: jest companies.test.js
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('goog', 'Google', 'Search Engine') RETURNING code, name, description`
  );
  testCompany = result.rows[0];

  const industryResult = await db.query(
    `INSERT INTO industries (code, industry) VALUES ('tech', 'Technology')
    ON CONFLICT (code) DO NOTHING 
    RETURNING code, industry`
  );

  testIndustry = industryResult.rows[0];
  await db.query(
    `INSERT INTO company_industries (comp_code, industry_code) VALUES ($1, $2)`,
    [testCompany.code, testIndustry.code]
  );
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM industries`);
  await db.query(`DELETE FROM company_industries`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Gets a list of companies", async () => {
    const response = await request(app).get("/companies");
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toHaveProperty("code", "goog");
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.company).toHaveProperty("code", "goog");
    expect(response.body.company.industries).toEqual(
      expect.arrayContaining(["Technology"])
    );
  });

  test("Responds with 404 for non-existent company", async () => {
    const response = await request(app).get(`/companies/invalidCode`);
    expect(response.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a new company", async () => {
    const response = await request(app).post("/companies").send({
      code: "fb",
      name: "Facebook",
      description: "Social Network",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.companies).toHaveProperty("code", "fb");
  });
});

describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "Alphabet",
        description: "Parent of Google",
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.companies.name).toBe("Alphabet");
  });

  test("Responds with 404 for invalid company update", async () => {
    const response = await request(app).put(`/companies/invalidCode`).send({
      name: "Failure",
      description: "This update should not work",
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const response = await request(app).delete(
      `/companies/${testCompany.code}`
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "DELETED" });
  });

  test("Responds with 404 for non-existent company deletion", async () => {
    const response = await request(app).delete(`/companies/invalidCode`);
    expect(response.statusCode).toBe(404);
  });
});
