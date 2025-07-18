import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

// Update group for a member by name
app.post('/api/update-group', async (req, res) => {
  const { name, group } = req.body;
  if (!name || !group) {
    return res.status(400).json({ error: 'Missing name or group' });
  }
  try {
    const result = await pool.query(
      'UPDATE members SET "group" = $1 WHERE name = $2 RETURNING *',
      [group, name]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, member: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(4000, () => {
  console.log('API server running on http://localhost:4000');
});
