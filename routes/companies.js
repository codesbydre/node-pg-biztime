const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// GET /companies : Returns list of companies
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

//GET /companies/[code] : Return obj of company: {company: {code, name, description, invoices: [id, ...]}} If the company given cannot be found, this should return a 404 status response.
router.get("/:code", async (req, res, next) => {
  try {
    const companyRes = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [req.params.code]
    );

    if (companyRes.rows.length === 0) {
      throw new ExpressError(
        `Cannot find company with code of ${req.params.code}`,
        404
      );
    }

    const invoiceRes = await db.query(
      `SELECT id FROM invoices WHERE comp_code = $1`,
      [req.params.code]
    );

    const company = companyRes.rows[0];
    const invoices = invoiceRes.rows.map((invoice) => invoice.id);

    company.invoices = invoices;

    return res.json({ company: company });
  } catch (e) {
    return next(e);
  }
});

// POST /companies : Adds a company. Needs to be given JSON. Returns obj of new company
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ companies: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// PUT /companies/[code] : Edit existing company. Should return 404 if company cannot be found. Needs to be given JSON
router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find company with code of ${code}`, 404);
    }
    return res.send({ companies: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// DELETE /companies/[code] : Deletes company. Should return 404 if company cannot be found.
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`DELETE FROM companies WHERE code=$1`, [
      code,
    ]);
    if (results.rowCount === 0) {
      throw new ExpressError(`Cannot find company with code of ${code}`, 404);
    }
    return res.send({ status: "DELETED" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
