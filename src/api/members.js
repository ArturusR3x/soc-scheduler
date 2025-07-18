// api/members.js
import pool from './db.js';

export async function getMembers() {
  const res = await pool.query('SELECT * FROM members');
  return res.rows; // returns an array of member records
}