// src/api/get-shift-schedule.js
import express from 'express';
import db from './db.js'; // assuming this exports your pg pool

const router = express.Router();

router.get('/api/shifts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.shift_date, s.shift_type, m.name
      FROM shifts s
      JOIN shift_assignments sa ON s.id = sa.shift_id
      JOIN members m ON sa.member_id = m.id
    `);

    // Format as { [date]: { [member]: shiftType } }
    const schedule = {};
    result.rows.forEach(row => {
      const dateKey = row.shift_date instanceof Date
        ? row.shift_date.toISOString().split('T')[0]
        : row.shift_date;
      if (!schedule[dateKey]) schedule[dateKey] = {};
      schedule[dateKey][row.name] = row.shift_type;
    });

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
