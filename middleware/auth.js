// middleware/auth.js (Updated version)

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { checkUserSuspension } from "./suspensionCheck";

const prisma = new PrismaClient();

export async function requireAuth(req) {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return {
        user: null,
        error: new Response(JSON.stringify({ message: "Not authenticated" }), {
          status: 401,
        }),
      };
    }

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => c.split("="))
    );
    const token = cookies.token;

    if (!token) {
      return {
        user: null,
        error: new Response(JSON.stringify({ message: "Not authenticated" }), {
          status: 401,
        }),
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return {
        user: null,
        error: new Response(JSON.stringify({ message: "User not found" }), {
          status: 401,
        }),
      };
    }

    // CHECK FOR SUSPENSION
    const suspension = await checkUserSuspension(user.userId);

    if (suspension) {
      const isPermanent = suspension.action === "PERMANENT_SUSPENSION";
      const endDateMsg = suspension.endDate
        ? `until ${new Date(suspension.endDate).toLocaleDateString()}`
        : "permanently";

      return {
        user: null,
        error: new Response(
          JSON.stringify({
            suspended: true,
            message: `Your account has been suspended ${endDateMsg}.`,
            reason: suspension.reason,
            action: suspension.action,
            startDate: suspension.startDate,
            endDate: suspension.endDate,
            isPermanent,
          }),
          { status: 403 }
        ),
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ message: "Authentication failed" }),
        { status: 401 }
      ),
    };
  } finally {
    await prisma.$disconnect();
  }
}

// For routes that need specific roles
export async function requireRole(req, allowedRoles) {
  const { user, error } = await requireAuth(req);

  if (error) return { user: null, error };

  const userRoles = user.userRoles.map((ur) => ur.role.roleName);
  const hasRole = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ message: "Insufficient permissions" }),
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
