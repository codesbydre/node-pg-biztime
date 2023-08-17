// terminal: jest invoices.test.js
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;
beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('goog', 'Google', 'Search Engine') RETURNING code, name, description`
  );
  testCompany = compResult.rows[0];
  const invResult = await db.query(
    `INSERT INTO invoices (comp_code, amt) VALUES ('goog', 100) RETURNING id, comp_code, amt`
  );

  testInvoice = invResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Gets a list of invoices", async () => {
    const res = await request(app).get(`/invoices`);
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices).toHaveLength(1);
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices.comp_code).toEqual(testInvoice.comp_code);
  });

  test("Responds with 404 for invalid invoice ID", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a new invoice", async () => {
    const res = await request(app)
      .post(`/invoices`)
      .send({ comp_code: "goog", amt: 200 });
    expect(res.statusCode).toBe(201);
    expect(res.body.invoices.amt).toEqual(200);
  });

  test("Prevents creating invoice without required fields", async () => {
    const res = await request(app).post(`/invoices`).send({ amt: 200 });
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /invoices/:id", () => {
  test("Updates a single invoice", async () => {
    const res = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 300 });
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices.amt).toEqual(300);
  });

  test("Responds with 404 for invalid update", async () => {
    const res = await request(app).put(`/invoices/0`).send({ amt: 300 });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "DELETED" });
  });

  test("Responds with 404 for missing invoice", async () => {
    const res = await request(app).delete(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});
