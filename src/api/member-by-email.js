import express from 'express';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'

  
});

app.get('/api/member-by-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Debug: log incoming email and all emails in DB
    console.log("Requested email:", email);
    const allEmails = await pool.query('SELECT email FROM members;');
    console.log("All emails in DB:", allEmails.rows);

    // Ensure case-insensitive comparison for email and trim spaces
    // Also trim the incoming email
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

app.listen(4005, () => {
  console.log('Member by email API running on http://localhost:4000');
});

// To check backend logs:
// 1. Open your terminal.
// 2. Run your backend script, e.g.:
//    node src/api/member-by-email.js
// 3. When you make a request (e.g., login from the frontend), logs will appear in the terminal.
//    Example output:
//    Requested email: arthur.jeremy@deltadatamandiri.com
//    All emails in DB: [ ... ]
//    No match for: arthur.jeremy@deltadatamandiri.com
// To test for arthur.jeremy@deltadatamandiri.com:
// 1. Start your backend: node src/api/member-by-email.js
// 2. In another terminal, run:
//    curl "http://localhost:4005/api/member-by-email?email=arthur.jeremy@deltadatamandiri.com"
// 3. Check the backend terminal for logs:
//    - You should see:
//      Requested email: arthur.jeremy@deltadatamandiri.com
//      All emails in DB: [ ... ]
//      (If found, you will get the user data as JSON. If not, "No match for: arthur.jeremy@deltadatamandiri.com")
