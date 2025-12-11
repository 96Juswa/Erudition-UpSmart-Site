import mysql from "mysql2/promise";
import { parse } from "url";

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // remove leading '/'
  port: dbUrl.port || 3306,
});

/**
 * Find a user by email from your local MySQL
 * Searches in students, faculty, and admin tables
 */
export async function findUserByEmail(email) {
  const tables = ["students", "faculty", "admin"];

  for (const table of tables) {
    const [rows] = await pool.query(
      `SELECT * FROM ${table} WHERE email = ? LIMIT 1`,
      [email]
    );
    if (rows.length > 0) return rows[0];
  }

  return null;
}
