const { pool } = require("../db/database");

beforeAll(async () => {
  await pool.query("BEGIN");
});

afterAll(async () => {
  await pool.query("ROLLBACK");
  await pool.end();
});
