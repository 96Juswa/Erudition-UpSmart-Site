// app/api/trust-rating/batch/route.js
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

/**
 * POST /api/trust-rating/batch
 * Recalculate trust ratings for all users
 *
 * Optional body: { userIds: [1, 2, 3], role: "resolver" }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userIds, role } = body;

    // Get all users if no specific IDs provided
    let users;

    if (userIds && Array.isArray(userIds)) {
      users = await prisma.user.findMany({
        where: { userId: { in: userIds } },
        include: {
          resolverProfile: true,
          clientProfile: true,
        },
      });
    } else {
      users = await prisma.user.findMany({
        include: {
          resolverProfile: true,
          clientProfile: true,
        },
      });
    }

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const user of users) {
      // Determine which profiles to update
      const profiles = [];

      if (!role || role === "resolver") {
        if (user.resolverProfile) {
          profiles.push({ userId: user.userId, role: "resolver" });
        }
      }

      if (!role || role === "client") {
        if (user.clientProfile) {
          profiles.push({ userId: user.userId, role: "client" });
        }
      }

      for (const profile of profiles) {
        results.total++;

        try {
          // Call the calculate endpoint
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trust-rating/calculate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(profile),
            }
          );

          if (response.ok) {
            results.successful++;
          } else {
            results.failed++;
            const error = await response.json();
            results.errors.push({
              userId: profile.userId,
              role: profile.role,
              error: error.error,
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: profile.userId,
            role: profile.role,
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Batch calculation completed: ${results.successful}/${results.total} successful`,
    });
  } catch (error) {
    console.error("Error in batch calculation:", error);
    return NextResponse.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
