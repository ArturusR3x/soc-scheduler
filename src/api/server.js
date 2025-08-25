import express from 'express';
import { Pool } from 'pg';
import fetch from 'node-fetch'; // Add at the top if not already imported
import cors from 'cors'; // <-- Add this line

const app = express();
app.use(express.json());

// Enable CORS for your frontend origin
app.use(cors({
  origin: 'http://192.168.1.229',
  credentials: true
}));

const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
});

// /api/get-group
app.get('/api/get-group', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const result = await pool.query('SELECT "group" FROM members WHERE name = $1;', [name]);
    if (result.rows.length === 0) return res.json({ group: "" });
    res.json({ group: result.rows[0].group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/member-by-email (centralized here, you do NOT need to run member-by-email.js separately)
app.get('/api/member-by-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Debug: log incoming email and all emails in DB
    console.log("Requested email:", email);
    const allEmails = await pool.query('SELECT email FROM members;');
    console.log("All emails in DB:", allEmails.rows);

    // Ensure case-insensitive comparison for email and trim spaces
    const trimmedEmail = email.trim();
    const result = await pool.query('SELECT * FROM members WHERE TRIM(LOWER(email)) = TRIM(LOWER($1));', [trimmedEmail]);
    if (result.rows.length === 0) {
      console.log("No match for:", trimmedEmail);
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/set-password
app.post('/api/set-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    await pool.query('UPDATE members SET password = $1 WHERE email = $2', [password, email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/all-member-groups
app.get('/api/all-member-groups', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, "group", email FROM members ORDER BY name ASC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/group-for-member
app.get('/api/group-for-member', async (req, res) => {
  const { member } = req.query;
  if (!member) return res.status(400).json({ error: 'Missing member name' });
  try {
    const result = await pool.query('SELECT "group" FROM members WHERE name = $1;', [member]);
    if (result.rows.length === 0) return res.json({ group: "" });
    res.json({ group: result.rows[0].group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/update-group
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

// /api/check-db
app.get('/api/check-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, email, "group" FROM members');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/members
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/save-month-schedule
app.post('/api/save-month-schedule', async (req, res) => {
  const { schedule, month } = req.body;
  if (!schedule || !month) return res.status(400).json({ error: 'Missing schedule or month' });
  try {
    console.log("Saving schedule for month:", month);
    console.log("Schedule data:", schedule);

    for (const dateKey in schedule) {
      // Fix: Ensure dateKey is in 'YYYY-MM-DD' format and not empty
      const cleanDateKey = (dateKey && dateKey.split("T")[0]) || "";
      if (!cleanDateKey || cleanDateKey === "") {
        console.warn(`❌ Skipping empty or invalid dateKey: "${dateKey}"`);
        continue;
      }
      const day = schedule[dateKey];
      for (const memberName in day) {
        const shiftType = day[memberName];
        // Find member_id by name
        const memberRes = await pool.query('SELECT id FROM members WHERE name = $1', [memberName]);
        if (memberRes.rows.length === 0) {
          console.log(`Member not found in DB: ${memberName}`);
          continue;
        }
        const member_id = memberRes.rows[0].id;

        // Check if shift exists for this date and type, else insert
        let shiftRes = await pool.query(
          'SELECT id FROM shifts WHERE shift_date = $1 AND shift_type = $2',
          [cleanDateKey, shiftType]
        );
        let shift_id;
        if (shiftRes.rows.length === 0) {
          // Insert new shift if not exists
          const insertShift = await pool.query(
            'INSERT INTO shifts (shift_date, shift_type) VALUES ($1, $2) RETURNING id',
            [cleanDateKey, shiftType]
          );
          shift_id = insertShift.rows[0].id;
        } else {
          shift_id = shiftRes.rows[0].id;
        }
        await pool.query(
          `DELETE FROM shift_assignments
           WHERE member_id = $1 AND shift_id IN (
             SELECT id FROM shifts WHERE shift_date = $2
           )`,
          [member_id, cleanDateKey]
        );
        await pool.query(
          'INSERT INTO shift_assignments (shift_id, member_id) VALUES ($1, $2)',
          [shift_id, member_id]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving schedule:", err);
    res.status(500).json({ error: err.message });
  }
}
);

// /api/delete-month-schedule
app.post('/api/delete-month-schedule', async (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'Missing month' });
  try {
    // Get first and last date of the month
    const year = new Date(month).getFullYear();
    const monthNum = new Date(month).getMonth() + 1;
    const firstDay = `${year}-${monthNum.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(year, monthNum, 0).toISOString().split("T")[0];

    // Delete assignments and shifts for the month
    await pool.query(
      `DELETE FROM shift_assignments WHERE shift_id IN (
         SELECT id FROM shifts WHERE shift_date >= $1 AND shift_date <= $2
       )`,
      [firstDay, lastDay]
    );
    await pool.query(
      `DELETE FROM shifts WHERE shift_date >= $1 AND shift_date <= $2`,
      [firstDay, lastDay]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/get-schedule', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.shift_date, 
        s.shift_type, 
        m.name AS member_name
      FROM shift_assignments sa
      JOIN shifts s ON sa.shift_id = s.id
      JOIN members m ON sa.member_id = m.id
      ORDER BY s.shift_date, s.shift_type
    `);

    // Convert to { [date]: { [member]: shiftType } }
    const schedule = {};
    result.rows.forEach(row => {
      // Format as M/D/YYYY (month/day/year, no leading zeros)
      const dateObj = new Date(row.shift_date);
      const dateKey = dateObj.toLocaleDateString('en-US');
      if (!schedule[dateKey]) schedule[dateKey] = {};
      schedule[dateKey][row.member_name] = row.shift_type;
    });

    res.json({ schedule });
  } catch (err) {
    console.error("❌ Error fetching schedule:", err);
    res.status(500).json({ error: err.message });
  }
});
// /api/get-month-schedule
app.get('/api/get-month-schedule', async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'Missing month' });
  try {
    // Get first and last date of the month
    const year = new Date(month).getFullYear();
    const monthNum = new Date(month).getMonth() + 1;
    const firstDay = `${year}-${monthNum.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(year, monthNum, 0).toISOString().split("T")[0];

    // Query all shifts and assignments for the month
    const result = await pool.query(`
      SELECT s.shift_date, s.shift_type, m.name AS member
      FROM shifts s
      JOIN shift_assignments sa ON sa.shift_id = s.id
      JOIN members m ON m.id = sa.member_id
      WHERE s.shift_date >= $1 AND s.shift_date <= $2
    `, [firstDay, lastDay]);

    // Format as { [date]: { [member]: shiftType } }
    const schedule = {};
    result.rows.forEach(row => {
      // Format as M/D/YYYY (month/day/year, no leading zeros)
      const dateObj = new Date(row.shift_date);
      const dateKey = dateObj.toLocaleDateString('en-US');
      if (!schedule[dateKey]) schedule[dateKey] = {};
      schedule[dateKey][row.member] = row.shift_type;
    });

    res.json({ schedule });
  } catch (err) {
    console.error("Error fetching month schedule:", err);
    res.status(500).json({ error: err.message });
  }
});

// /api/google-login
app.post('/api/google-login', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Missing credential" });

  try {
    // Validate token with Google
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const googleData = await googleRes.json();

    if (!googleData.email_verified) {
      return res.status(401).json({ error: "Google email not verified" });
    }

    // Find user in your DB by email
    const userRes = await pool.query('SELECT * FROM members WHERE LOWER(email) = LOWER($1)', [googleData.email]);
    if (userRes.rows.length === 0) {
      // Optionally: create user if not found, or reject
      return res.status(403).json({ error: "User not authorized" });
    }
    // Return user info (do not include password)
    const user = userRes.rows[0];
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Google login failed" });
  }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Centralized API server running on http://localhost:${PORT}`);
});

// Now you only need to run: node src/api/server.js
// All API endpoints including /api/member-by-email are available on port 4000.

// Error: permission denied for table shifts
// Solution: Grant privileges to soc_user for the shifts table in PostgreSQL.
// Run this SQL in psql as a superuser:
//
// GRANT ALL PRIVILEGES ON TABLE shifts TO soc_user;
// GRANT ALL PRIVILEGES ON TABLE shift_assignments TO soc_user;
// GRANT ALL PRIVILEGES ON TABLE members TO soc_user;
//
// After running the above, restart your backend and try saving the schedule again.
