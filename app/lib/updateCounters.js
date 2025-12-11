import prisma from "@/app/lib/prisma";

export async function updateCounters(event, payload) {
  const { resolverId, clientId, reviewRating } = payload;

  switch (event) {
    // ---------------- BOOKING EVENTS ----------------
    case "BOOKING_CREATED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { totalBookings: { increment: 1 } },
        });
      }
      if (clientId) {
        await prisma.clientProfile.update({
          where: { userId: clientId },
          data: { totalBookings: { increment: 1 } },
        });
      }
      break;

    case "BOOKING_COMPLETED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { completedBookings: { increment: 1 } },
        });
      }
      if (clientId) {
        await prisma.clientProfile.update({
          where: { userId: clientId },
          data: { completedBookings: { increment: 1 } },
        });
      }
      break;

    case "BOOKING_CANCELED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { cancellations: { increment: 1 } },
        });
      }
      if (clientId) {
        await prisma.clientProfile.update({
          where: { userId: clientId },
          data: { cancellations: { increment: 1 } },
        });
      }
      break;

    case "REVIEW_COMPLETED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { completedBookings: { increment: 1 } },
        });
      }
      if (clientId) {
        await prisma.clientProfile.update({
          where: { userId: clientId },
          data: { completedBookings: { increment: 1 } },
        });
      }
      break;

    // ---------------- REVIEW EVENTS ----------------
    case "REVIEW_RECEIVED":
      if (resolverId && reviewRating !== undefined) {
        let positive = 0,
          neutral = 0,
          negative = 0;
        if (reviewRating >= 4) positive = 1;
        else if (reviewRating === 3) neutral = 1;
        else negative = 1;

        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: {
            reviewsReceivedCount: { increment: 1 },
            totalStarsReceived: { increment: reviewRating },
            positiveReviews: { increment: positive },
            neutralReviews: { increment: neutral },
            negativeReviews: { increment: negative },
          },
        });

        // Update trustRating
        const profile = await prisma.resolverProfile.findUnique({
          where: { userId: resolverId },
        });
        const trustRating = profile.reviewsReceivedCount
          ? profile.totalStarsReceived / profile.reviewsReceivedCount
          : 0;

        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { trustRating },
        });
      }
      break;

    case "REVIEW_GIVEN":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { reviewsGiven: { increment: 1 } },
        });
      }
      if (clientId) {
        await prisma.clientProfile.update({
          where: { userId: clientId },
          data: { reviewsGiven: { increment: 1 } },
        });
      }
      break;

    // ---------------- PORTFOLIO EVENTS ----------------
    case "PORTFOLIO_APPROVED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { approvedPortfolios: { increment: 1 } },
        });
      }
      break;

    case "PORTFOLIO_REMOVED":
      if (resolverId) {
        await prisma.resolverProfile.update({
          where: { userId: resolverId },
          data: { approvedPortfolios: { decrement: 1 } },
        });
      }
      break;

    default:
      console.warn("Unknown event type:", event);
  }
}
