import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req, { params }) {
  try {
    const bookingId = Number(params.bookingId);
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: true,
      },
    });

    if (!booking || !booking.serviceListingId || !booking.completedAt) {
      return NextResponse.json(
        { error: "Invalid booking or not completed yet." },
        { status: 400 }
      );
    }

    const { completedAt, clientId, serviceListingId } = booking;

    const reviews = await prisma.review.findMany({
      where: {
        serviceListingId: serviceListingId,
        reviewerId: { in: [clientId, booking.serviceListing.resolverId] },
      },
    });

    const hasClientReview = reviews.some((r) => r.reviewerId === clientId);
    const hasResolverReview = reviews.some(
      (r) => r.reviewerId === booking.serviceListing.resolverId
    );

    const daysSinceCompleted =
      (new Date().getTime() - new Date(completedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const reviewDone = hasClientReview && hasResolverReview;
    const timedOut = daysSinceCompleted >= 7;

    return NextResponse.json({
      reviewStatus:
        reviewDone || timedOut ? "REVIEW_COMPLETED" : "AWAITING_REVIEW",
      hasClientReview,
      hasResolverReview,
      timedOut,
    });
  } catch (error) {
    console.error("❌ Error fetching review status:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
