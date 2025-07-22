// src/api/get-shift-schedule.js
import express from 'express';
import db from './db.js'; // assuming this exports your pg pool

const router = express.Router();

router.get('/api/shifts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.date, sa.member_id, m.name, sa.shift_id
      FROM shifts s
      JOIN shift_assignments sa ON s.id = sa.shift_id
      JOIN members m ON sa.member_id = m.id
    `);

    const schedule = {};
    result.rows.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      if (!schedule[dateKey]) schedule[dateKey] = {};
      schedule[dateKey][row.name] = row.shift_id;
    });

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
