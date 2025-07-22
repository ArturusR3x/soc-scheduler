import express from 'express';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

app.get('/api/group-for-member', async (req, res) => {
  const { member } = req.query; // member is the full name
  if (!member) return res.status(400).json({ error: 'Missing member name' });
  try {
    const result = await pool.query('SELECT "group" FROM members WHERE name = $1;', [member]);
    if (result.rows.length === 0) return res.json({ group: "" });
    res.json({ group: result.rows[0].group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4003, () => {
  console.log('Group for member API running on http://localhost:4003');   
});
