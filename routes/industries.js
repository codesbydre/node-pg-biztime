const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

//Add an industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//List all industries and show company code(s) for that industry
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.code, i.industry, ci.comp_code 
      FROM industries i
      LEFT JOIN company_industries ci ON i.code = ci.industry_code`
    );

    // Organize data to group company codes under their respective industries
    const industries = {};
    for (let row of results.rows) {
      if (!industries[row.code]) {
        industries[row.code] = {
          industry: row.industry,
          companies: [],
        };
      }
      if (row.comp_code) industries[row.code].companies.push(row.comp_code);
    }

    return res.json({ industries: Object.values(industries) });
  } catch (err) {
    return next(err);
  }
});

//Associating an industry to a company
router.post("/associate", async (req, res, next) => {
  try {
    const { comp_code, industry_code } = req.body;
    await db.query(
      `INSERT INTO company_industries (comp_code, industry_code) VALUES ($1, $2)`,
      [comp_code, industry_code]
    );
    return res.json({ status: "Associated!" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
