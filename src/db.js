// db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'soc_user',
  host: 'localhost',
  database: 'soc_scheduler',
  password: 'your_secure_password',
  port: 5432,
});

export default pool;