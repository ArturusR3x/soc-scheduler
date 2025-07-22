import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

app.post('/api/save-month-schedule', async (req, res) => {
  const { schedule, month } = req.body;
  if (!schedule || !month) return res.status(400).json({ error: 'Missing schedule or month' });

  try {
    console.log("Saving schedule for month:", month);

    for (const dateKey in schedule) {
      const day = schedule[dateKey];

      for (const memberName in day) {
        const shiftType = day[memberName];

        // 1. Get member ID by name
        const memberRes = await pool.query('SELECT id FROM members WHERE name = $1', [memberName]);
        if (memberRes.rows.length === 0) {
          console.warn(`❌ Member not found: ${memberName}`);
          continue;
        }
        const member_id = memberRes.rows[0].id;

        // 2. Get or create shift
        let shift_id;
        const shiftRes = await pool.query(
          'SELECT id FROM shifts WHERE shift_date = $1 AND shift_type = $2',
          [dateKey, shiftType]
        );

        if (shiftRes.rows.length === 0) {
          const insertShift = await pool.query(
            'INSERT INTO shifts (shift_date, shift_type) VALUES ($1, $2) RETURNING id',
            [dateKey, shiftType]
          );
          shift_id = insertShift.rows[0].id;
        } else {
          shift_id = shiftRes.rows[0].id;
        }

        // 3. Upsert to shift_assignments: ensure no duplicates
        // Optional: If you want to ensure a member only has one shift per day:
        await pool.query(
          `DELETE FROM shift_assignments 
           WHERE member_id = $1 
           AND shift_id IN (
             SELECT id FROM shifts WHERE shift_date = $2
           )`,
          [member_id, dateKey]
        );

        // 4. Insert assignment
        await pool.query(
          'INSERT INTO shift_assignments (shift_id, member_id) VALUES ($1, $2)',
          [shift_id, member_id]
        );

        console.log(`✅ Assigned ${memberName} to shift ${shiftType} on ${dateKey}`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving schedule:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`📅 Save Month Schedule API running on http://localhost:${PORT}`);
});
