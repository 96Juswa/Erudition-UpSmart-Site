import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/** --------------------------
 * Password hashing & verification
 * -------------------------- */

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Hash a plain text password
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/** --------------------------
 * JWT helper (optional, for other parts of your app)
 * -------------------------- */
export async function getCurrentUserIdFromRequest(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key, decodeURIComponent(v.join("="))];
      })
    );
    const token = cookies.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId; // assuming JWT payload contains userId
  } catch {
    return null;
  }
}
