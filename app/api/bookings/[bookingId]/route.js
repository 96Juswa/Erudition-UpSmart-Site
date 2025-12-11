import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req, contextPromise) {
  const { params } = await contextPromise;
  const bookingId = Number(params.bookingId);

  if (!bookingId || isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  try {
    // Fetch booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        conversation: true,
        serviceListing: {
          include: {
            resolver: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        serviceRequest: {
          include: {
            client: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        client: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        latestProposal: true,
        progressUpdates: {
          orderBy: { createdAt: "asc" },
          include: {
            updater: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        changeRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            requester: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        contracts: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // If booking doesn't have a conversation, try to find and link it
    let conversation = booking.conversation;

    if (!conversation) {
      console.log("⚠️ Booking has no conversation, attempting to find one...");

      const foundConversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            booking.serviceListingId
              ? { listingId: booking.serviceListingId }
              : {},
            booking.serviceRequestId
              ? { requestId: booking.serviceRequestId }
              : {},
          ].filter((obj) => Object.keys(obj).length > 0),
        },
        orderBy: { createdAt: "desc" },
      });

      if (foundConversation) {
        console.log("✅ Found conversation:", foundConversation.conversationId);

        if (!foundConversation.bookingId) {
          await prisma.conversation.update({
            where: { conversationId: foundConversation.conversationId },
            data: { bookingId: booking.id },
          });
          console.log("✅ Linked conversation to booking");
        }

        conversation = foundConversation;
      } else {
        console.log("❌ No conversation found for this booking");
      }
    }

    // Determine booking type and get relevant data
    const isServiceListing = !!booking.serviceListingId;
    const isServiceRequest = !!booking.serviceRequestId;

    let bookingType = null;
    let title = "Untitled";
    let resolverId = null;

    if (isServiceListing && booking.serviceListing) {
      bookingType = "SERVICE_LISTING";
      title = booking.serviceListing.title;
      resolverId = booking.serviceListing.resolver?.userId;
    } else if (isServiceRequest && booking.serviceRequest) {
      bookingType = "SERVICE_REQUEST";
      title = booking.serviceRequest.title;
      resolverId = booking.serviceRequest.resolverId;
    }

    const {
      clientId,
      progressUpdates,
      completedAt,
      status,
      clientAcknowledged,
      paymentDue,
    } = booking;

    // Only show full progress tracking for active bookings
    if (
      status !== "CONFIRMED" &&
      status !== "IN_PROGRESS" &&
      status !== "COMPLETED" &&
      status !== "AWAITING_REVIEW" &&
      status !== "REVIEW_COMPLETED"
    ) {
      return NextResponse.json({
        booking: {
          id: booking.id,
          title,
          status: booking.status,
          clientId: booking.clientId,
          resolverId,
          bookingType,
          currentStepIndex: -1,
          progressUpdates: [],
          clientAcknowledged: null,
          reviewStatus: "NOT_APPLICABLE",
          hasClientReview: false,
          hasResolverReview: false,
          timedOut: false,
          needsUpdate: false,
          contract: booking.contracts?.[booking.contracts.length - 1] || null,
          conversation: conversation,
          serviceListing: booking.serviceListing,
          serviceRequest: booking.serviceRequest,
          client: booking.client,
          latestProposal: booking.latestProposal,
          changeRequests: booking.changeRequests,
        },
      });
    }

    // Enhanced step calculation
    let currentStepIndex = 0;
    const lastUpdate = progressUpdates?.slice(-1)[0];

    if (!lastUpdate) {
      currentStepIndex = 0;
    } else {
      switch (lastUpdate.status) {
        case "AWAITING_START":
          currentStepIndex = 0;
          break;
        case "IN_PROGRESS":
          currentStepIndex = 1;
          break;
        case "COMPLETED":
          if (clientAcknowledged === false) {
            currentStepIndex = 1;
          } else if (clientAcknowledged === true) {
            currentStepIndex = 3;
          } else {
            currentStepIndex = 2;
          }
          break;
        case "AWAITING_REVIEW":
          currentStepIndex = 3;
          break;
        case "REVIEW_COMPLETED":
          currentStepIndex = 3;
          break;
        default:
          currentStepIndex = 0;
      }
    }

    // ✅ FIXED: Calculate review status - Check reviews whenever in review stage OR already completed
    let reviewStatus = "AWAITING_REVIEW";
    let hasClientReview = false;
    let hasResolverReview = false;
    let timedOut = false;

    // Check reviews if:
    // 1. Client has acknowledged (clientAcknowledged === true) OR
    // 2. Status is already AWAITING_REVIEW or REVIEW_COMPLETED OR
    // 3. We're in step 3 (review stage)
    const shouldCheckReviews =
      clientAcknowledged === true ||
      status === "AWAITING_REVIEW" ||
      status === "REVIEW_COMPLETED" ||
      currentStepIndex === 3;

    if (shouldCheckReviews && resolverId) {
      console.log("🔍 Checking reviews for booking:", bookingId);

      let reviews = [];

      if (isServiceListing) {
        reviews = await prisma.review.findMany({
          where: {
            serviceListingId: booking.serviceListingId,
            OR: [
              { reviewerId: clientId, reviewedUserId: resolverId },
              { reviewerId: resolverId, reviewedUserId: clientId },
            ],
          },
        });
      } else if (isServiceRequest) {
        reviews = await prisma.review.findMany({
          where: {
            serviceRequestId: booking.serviceRequestId,
            OR: [
              { reviewerId: clientId, reviewedUserId: resolverId },
              { reviewerId: resolverId, reviewedUserId: clientId },
            ],
          },
        });
      }

      hasClientReview = reviews.some((r) => r.reviewerId === clientId);
      hasResolverReview = reviews.some((r) => r.reviewerId === resolverId);

      console.log("📊 Review status:", { hasClientReview, hasResolverReview });

      // Calculate timeout
      if (completedAt) {
        const daysSinceCompleted =
          (new Date().getTime() - new Date(completedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        timedOut = daysSinceCompleted >= 7;
      }

      // Determine overall review status
      if (hasClientReview && hasResolverReview) {
        reviewStatus = "REVIEW_COMPLETED";
      } else if (timedOut) {
        reviewStatus = "REVIEW_COMPLETED";
      } else {
        reviewStatus = "AWAITING_REVIEW";
      }
    }

    // Calculate if resolver needs to send update
    let needsUpdate = false;
    if (currentStepIndex === 1 && lastUpdate) {
      const now = new Date();
      const lastUpdateTime = new Date(lastUpdate.createdAt);
      const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

      const deadline = new Date(booking.deadline || paymentDue);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      if (hoursUntilDeadline < 48) {
        needsUpdate = hoursSinceUpdate >= 12;
      } else {
        needsUpdate = hoursSinceUpdate >= 24;
      }
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        title,
        status,
        progressUpdates,
        clientId,
        resolverId,
        completedAt,
        clientAcknowledged,
        currentStepIndex,
        reviewStatus,
        hasClientReview,
        hasResolverReview,
        timedOut,
        needsUpdate,
        deadline: booking.deadline || paymentDue,
        bookingType,
        serviceListingId: booking.serviceListingId,
        serviceRequestId: booking.serviceRequestId,
        changeRequests: booking.changeRequests,
        contract: booking.contracts?.[booking.contracts.length - 1] || null,
        conversation: conversation,
        serviceListing: booking.serviceListing,
        serviceRequest: booking.serviceRequest,
        client: booking.client,
        latestProposal: booking.latestProposal,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
