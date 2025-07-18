import express from 'express';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

app.get('/api/get-group', async (req, res) => {
  const { name } = req.query;
  console.log("Requested name (full name):", name);
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    // Exact match
    const result = await pool.query('SELECT "group" FROM members WHERE name = $1;', [name]);
    console.log("DB result:", result.rows);
    if (result.rows.length === 0) return res.json({ group: "" });
    res.json({ group: result.rows[0].group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4001, () => {
  console.log('Get group API running on http://localhost:4001');
});
