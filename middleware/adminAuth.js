// middleware/adminAuth.js

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function verifyAdmin(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return {
        isValid: false,
        error: "No authentication token found",
        status: 401,
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin) {
      return {
        isValid: false,
        error: "Insufficient permissions",
        status: 403,
      };
    }

    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return {
        isValid: false,
        error: "User not found",
        status: 404,
      };
    }

    const isAdmin = user.userRoles.some((ur) => ur.role.roleName === "admin");

    if (!isAdmin) {
      return {
        isValid: false,
        error: "Admin role revoked",
        status: 403,
      };
    }

    return {
      isValid: true,
      user: decoded,
      adminUser: user,
    };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return {
        isValid: false,
        error: "Session expired. Please login again.",
        status: 401,
      };
    }

    return {
      isValid: false,
      error: "Invalid authentication token",
      status: 401,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function requireAdmin(req) {
  const auth = await verifyAdmin(req);

  if (!auth.isValid) {
    return {
      error: new Response(JSON.stringify({ message: auth.error }), {
        status: auth.status,
      }),
    };
  }

  return { admin: auth.adminUser, user: auth.user };
}
