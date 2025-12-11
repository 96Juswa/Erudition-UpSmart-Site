// app/api/trust-rating/calculate/route.js
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

/**
 * Fetch user statistics from database
 */
async function getUserStats(userId, role) {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        portfolios: { where: { status: "APPROVED" } },
        reviewsReceived: true,
        resolverProfile: role === "resolver",
        clientProfile: role === "client",
      },
    });

    if (!user) throw new Error("User not found");

    // Get transactions where user participated
    const transactions = await prisma.booking.findMany({
      where: {
        OR: [{ clientId: userId }, { serviceListing: { resolverId: userId } }],
      },
    });

    const transactionCount = transactions.length;
    const completedTransactions = transactions.filter(
      (t) => t.status === "COMPLETED" || t.status === "REVIEW_COMPLETED"
    ).length;

    // Review stats
    const reviews = user.reviewsReceived;
    const reviewCount = reviews.length;
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const neutralReviews = reviews.filter((r) => r.rating === 3).length;
    const negativeReviews = reviews.filter((r) => r.rating <= 2).length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRatings = reviewCount > 0 ? totalRating / reviewCount : 1.0;
    const starCount = totalRating;

    // Bio info
    const bio =
      role === "resolver" ? user.resolverProfile?.bio : user.clientProfile?.bio;
    const bioLength = bio ? bio.length : 0;
    const bioWordCount = bio ? bio.split(/\s+/).length : 0;

    const portfolioCount = user.portfolios.length;

    return {
      userId,
      portfolioCount,
      averageRatings: parseFloat(averageRatings.toFixed(2)),
      transactionCount,
      completedTransactions,
      reviewCount,
      starCount,
      positiveReviews,
      neutralReviews,
      negativeReviews,
      bioLength,
      bioWordCount,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
}

/**
 * Call ML service to predict trust rating
 */
async function callMLService(userData) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "ML service error");
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling ML service:", error);
    throw new Error(`ML service unavailable: ${error.message}`);
  }
}

/**
 * Update trust rating in database
 */
async function updateTrustRating(userId, role, trustRating) {
  try {
    if (role === "resolver") {
      await prisma.resolverProfile.update({
        where: { userId },
        data: { trustRating },
      });
    } else if (role === "client") {
      await prisma.clientProfile.update({
        where: { userId },
        data: { trustRating },
      });
    }
  } catch (error) {
    console.error("Error updating trust rating:", error);
    throw error;
  }
}

/**
 * POST /api/trust-rating/calculate
 * Calculate trust rating for a specific user or due to a cancellation
 */
export async function POST(req) {
  try {
    const { userId, role, bookingChangeRequestId } = await req.json();

    let targetUserId = userId;
    let targetRole = role;

    // Handle cancellation scenario
    if (bookingChangeRequestId) {
      const changeRequest = await prisma.bookingChangeRequest.findUnique({
        where: { id: bookingChangeRequestId },
        include: { booking: { include: { serviceListing: true } } },
      });

      if (!changeRequest) throw new Error("Booking change request not found");
      if (changeRequest.type !== "CANCELLATION")
        throw new Error("Not a cancellation request");

      targetUserId = changeRequest.requesterId;
      targetRole =
        changeRequest.booking.clientId === targetUserId ? "client" : "resolver";

      console.log(
        `⚠️ Cancellation detected: Updating trust for initiator ${targetUserId} (${targetRole})`
      );
    } else {
      if (
        !targetUserId ||
        !targetRole ||
        !["client", "resolver"].includes(targetRole)
      ) {
        return NextResponse.json(
          { error: "userId and valid role (client or resolver) are required" },
          { status: 400 }
        );
      }
    }

    // Step 1: Fetch user statistics
    const userStats = await getUserStats(targetUserId, targetRole);

    // Step 2: Call ML service
    const mlResult = await callMLService(userStats);
    if (!mlResult.success)
      throw new Error(mlResult.error || "ML prediction failed");

    let trustRating = mlResult.trustRating;

    // Apply penalty if this was a cancellation
    if (bookingChangeRequestId) {
      trustRating *= 0.9; // 10% trust drop for cancellation
      trustRating = parseFloat(trustRating.toFixed(2));
    }

    // Step 3: Update trust rating
    await updateTrustRating(targetUserId, targetRole, trustRating);

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      role: targetRole,
      trustRating,
      userStats,
      message: "Trust rating calculated and updated successfully",
    });
  } catch (error) {
    console.error("❌ Error calculating trust rating:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to calculate trust rating",
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trust-rating/calculate?userId=123&role=resolver
 * Get current trust rating without recalculating
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("userId"));
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    const profile =
      role === "resolver"
        ? await prisma.resolverProfile.findUnique({ where: { userId } })
        : await prisma.clientProfile.findUnique({ where: { userId } });

    if (!profile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      userId,
      role,
      trustRating: profile.trustRating,
    });
  } catch (error) {
    console.error("Error fetching trust rating:", error);
    return NextResponse.json(
      { error: "Failed to fetch trust rating" },
      { status: 500 }
    );
  }
}
