import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "./prisma"; // adjust path if needed

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch roles, but if DB fails, just return decoded
    let userRoles = [];
    try {
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
        select: {
          userRoles: {
            select: {
              role: {
                select: { roleName: true },
              },
            },
          },
        },
      });

      if (user?.userRoles) {
        userRoles = user.userRoles.map((r) => r.role.roleName);
      }
    } catch (err) {
      console.error("Failed to fetch user roles:", err);
    }

    return { ...decoded, userRoles };
  } catch (err) {
    return null;
  }
}
