import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  const { listingId } = await context.params;

  try {
    // Step 1: Get the resolverId for the serviceListing
    const listing = await prisma.serviceListing.findUnique({
      where: {
        id: parseInt(listingId, 10),
      },
      select: {
        resolverId: true,
      },
    });

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        serviceListingId: parseInt(listingId, 10),
        reviewerId: {
          not: listing.resolverId, // ✅ Exclude the resolver (means this must be the client)
        },
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            clientProfile: {
              select: {
                trustRating: true,
              },
            },
          },
        },
      },
      orderBy: {
        reviewDate: "desc",
      },
    });

    const formatted = reviews.map((review) => ({
      reviewer: `${review.reviewer.firstName} ${review.reviewer.lastName.charAt(0)}.`,
      comment: review.reviewText || "",
      rating: review.rating,
      profileImage: review.reviewer.profilePicture,
      trustRating: review.reviewer.clientProfile?.trustRating || 0,
      createdAt: review.reviewDate,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return new NextResponse("Failed to load reviews", { status: 500 });
  }
}
