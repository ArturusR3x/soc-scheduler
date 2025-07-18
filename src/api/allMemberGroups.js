import express from 'express';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

app.get('/api/all-member-groups', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, "group" FROM members ORDER BY name ASC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4002, () => {
  console.log('All member groups API running on http://localhost:4002');
});
