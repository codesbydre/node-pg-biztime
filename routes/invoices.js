const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// GET /invoices : Return info on invoices
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

// GET /invoices/[id] : Returns obj on given invoice. If invoice cannot be found, returns 404.
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [
      id,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404);
    }
    return res.json({ invoices: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// POST /invoices : Adds an invoice. Needs to be passed in JSON body
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoices: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404. Needs to be passed in a JSON body
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404);
    }
    return res.send({ invoices: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// DELETE /invoices/[id] : Deletes an invoice.If invoice cannot be found, returns a 404.
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    if (results.rowCount === 0) {
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404);
    }
    return res.send({ status: "DELETED" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
