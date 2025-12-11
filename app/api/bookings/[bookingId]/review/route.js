import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { recalculateTrustRating } from "@/app/lib/trustRating";

export async function POST(req, contextPromise) {
  const { params } = await contextPromise;
  try {
    const bookingId = Number(params.bookingId);
    const body = await req.json();
    const { reviewerId, reviewText, rating } = body;

    if (!bookingId || !reviewerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Missing or invalid input. Rating must be 1-5." },
        { status: 400 }
      );
    }

    // Fetch booking with related service info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: { select: { resolverId: true } },
        serviceRequest: { select: { resolverId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Ensure booking is in review stage
    if (
      booking.status !== "AWAITING_REVIEW" ||
      booking.clientAcknowledged !== true
    ) {
      return NextResponse.json(
        { error: "Booking is not in review stage" },
        { status: 400 }
      );
    }

    const { clientId } = booking;
    const isServiceListing = !!booking.serviceListingId;
    const isServiceRequest = !!booking.serviceRequestId;

    let resolverId = null;
    let serviceListingId = null;
    let serviceRequestId = null;

    if (isServiceListing && booking.serviceListing) {
      resolverId = booking.serviceListing.resolverId;
      serviceListingId = booking.serviceListingId;
    } else if (isServiceRequest && booking.serviceRequest) {
      resolverId = booking.serviceRequest.resolverId;
      serviceRequestId = booking.serviceRequestId;
    }

    if (!resolverId) {
      return NextResponse.json(
        { error: "Could not determine resolver for this booking" },
        { status: 400 }
      );
    }

    // Verify reviewer is client or resolver
    if (reviewerId !== clientId && reviewerId !== resolverId) {
      return NextResponse.json(
        { error: "Unauthorized to review this booking" },
        { status: 403 }
      );
    }

    // Determine who is being reviewed
    const reviewedUserId = reviewerId === clientId ? resolverId : clientId;

    console.log("📝 Review submission:", {
      bookingId,
      reviewerId,
      reviewedUserId,
      isClient: reviewerId === clientId,
      serviceListingId,
      serviceRequestId,
    });

    // ✅ FIXED: More precise check for existing review
    const whereClause = {
      reviewerId,
      reviewedUserId,
    };

    if (isServiceListing) {
      whereClause.serviceListingId = serviceListingId;
    } else if (isServiceRequest) {
      whereClause.serviceRequestId = serviceRequestId;
    }

    const existingReview = await prisma.review.findFirst({
      where: whereClause,
    });

    if (existingReview) {
      console.log("❌ Review already exists:", existingReview.id);
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Check if the OTHER party has already reviewed BEFORE creating new review
    const isReviewerClient = reviewerId === clientId;
    const otherPartyId = isReviewerClient ? resolverId : clientId;

    const otherWhereClause = {
      reviewerId: otherPartyId,
      reviewedUserId: reviewerId,
    };

    if (isServiceListing) {
      otherWhereClause.serviceListingId = serviceListingId;
    } else if (isServiceRequest) {
      otherWhereClause.serviceRequestId = serviceRequestId;
    }

    const otherPartyReview = await prisma.review.findFirst({
      where: otherWhereClause,
    });

    const otherPartyHasReviewed = !!otherPartyReview;

    console.log("🔍 Other party review status:", {
      otherPartyId,
      otherPartyHasReviewed,
      otherReviewId: otherPartyReview?.id || null,
    });

    // Create the new review
    const reviewData = {
      reviewerId,
      reviewedUserId,
      reviewText: reviewText || null,
      rating,
    };

    if (isServiceListing) reviewData.serviceListingId = serviceListingId;
    if (isServiceRequest) reviewData.serviceRequestId = serviceRequestId;

    const newReview = await prisma.review.create({ data: reviewData });

    console.log("✅ Review created:", newReview.id);

    // Recalculate trust rating for the reviewed user
    const userRole = reviewerId === clientId ? "resolver" : "client";
    await recalculateTrustRating(reviewedUserId, userRole);

    // ✅ FIXED: Only mark as fully completed if the OTHER party had already reviewed
    if (otherPartyHasReviewed) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "REVIEW_COMPLETED" },
      });

      await prisma.progressUpdate.create({
        data: {
          bookingId,
          updaterId: reviewerId,
          status: "REVIEW_COMPLETED",
          message:
            "Both parties have completed their reviews. Booking fully completed.",
        },
      });

      console.log(
        `✅ Booking ${bookingId} fully completed - both reviews submitted`
      );
    } else {
      console.log(
        `⏳ Booking ${bookingId} - Waiting for ${isReviewerClient ? "resolver" : "client"} to submit their review`
      );
    }

    return NextResponse.json(
      {
        message: "Review submitted successfully",
        review: newReview,
        allReviewsCompleted: otherPartyHasReviewed,
        bookingType: isServiceListing ? "SERVICE_LISTING" : "SERVICE_REQUEST",
        waitingFor: otherPartyHasReviewed
          ? null
          : isReviewerClient
            ? "resolver"
            : "client",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
