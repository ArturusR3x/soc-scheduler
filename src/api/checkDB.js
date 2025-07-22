import { Pool } from 'pg';
   const pool = new Pool({
     connectionString: 'postgresql://soc_user:admin123@localhost:5432/soc_scheduler'
   });

   // Fetch all users from the members table for testing
   pool.query('SELECT name, email, "group" FROM members', (err, res) => {
     if (err) {
       console.error('Database connection failed:', err);
     } else {
       console.log('Users in soc_scheduler:', res.rows);
     }
   });

   // To run this test, open your terminal and execute:
   // node src/api/checkDB.js
   // If successful, you will see the list of users from the database.
   // If not, you will see an error message.