// middleware/suspensionCheck.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Check if a user is currently suspended
 * Returns suspension info if active, null if not suspended
 */
export async function checkUserSuspension(userId) {
  try {
    const activeSuspension = await prisma.userModeration.findFirst({
      where: {
        userId: userId,
        isActive: true,
        action: {
          in: ["TEMPORARY_SUSPENSION", "PERMANENT_SUSPENSION"],
        },
        OR: [
          { endDate: null }, // Permanent suspension
          { endDate: { gte: new Date() } }, // Temporary suspension not yet expired
        ],
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        moderator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // If temporary suspension has expired, deactivate it
    if (
      activeSuspension &&
      activeSuspension.action === "TEMPORARY_SUSPENSION" &&
      activeSuspension.endDate &&
      new Date() > activeSuspension.endDate
    ) {
      await prisma.userModeration.update({
        where: { id: activeSuspension.id },
        data: { isActive: false },
      });
      return null;
    }

    return activeSuspension;
  } catch (error) {
    console.error("Error checking user suspension:", error);
    return null;
  }
}

/**
 * Middleware to check suspension before allowing access
 * Use this in protected routes
 */
export async function requireNotSuspended(req, user) {
  const suspension = await checkUserSuspension(user.userId);

  if (suspension) {
    const isPermanent = suspension.action === "PERMANENT_SUSPENSION";
    const endDateMsg = suspension.endDate
      ? `until ${suspension.endDate.toLocaleDateString()}`
      : "permanently";

    return new Response(
      JSON.stringify({
        suspended: true,
        message: `Your account has been suspended ${endDateMsg}.`,
        reason: suspension.reason,
        action: suspension.action,
        startDate: suspension.startDate,
        endDate: suspension.endDate,
        notes: suspension.notes,
        isPermanent,
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null; // No suspension, allow access
}

/**
 * Check for warnings (doesn't block access, just returns info)
 */
export async function getUserWarnings(userId) {
  try {
    const warnings = await prisma.userModeration.findMany({
      where: {
        userId: userId,
        action: "WARNING",
        isActive: true,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        moderator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return warnings;
  } catch (error) {
    console.error("Error fetching user warnings:", error);
    return [];
  }
}
