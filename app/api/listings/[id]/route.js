import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * GET /api/listings/[id]
 * Fetch a single listing by ID
 */
export async function GET(request, context) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
  }

  try {
    const listing = await prisma.serviceListing.findUnique({
      where: { id: listingId },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        resolver: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        associatedPortfolios: {
          include: {
            portfolioItem: {
              include: {
                portfolioFiles: true,
              },
            },
          },
        },
      },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing, { status: 200 });
  } catch (error) {
    console.error("GET /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * Delete a listing and related records by ID
 */
export async function DELETE(request, context) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete associated portfolio items
      await tx.serviceListingPortfolioItem.deleteMany({
        where: { serviceListingId: listingId },
      });

      // Delete associated bookings and their related data
      const bookings = await tx.booking.findMany({
        where: { serviceListingId: listingId },
        select: { id: true },
      });

      for (const booking of bookings) {
        // Delete booking change requests
        await tx.bookingChangeRequest.deleteMany({
          where: { bookingId: booking.id },
        });

        // Delete progress updates
        await tx.progressUpdate.deleteMany({
          where: { bookingId: booking.id },
        });

        // Delete payments
        await tx.payment.deleteMany({
          where: { bookingId: booking.id },
        });

        // Delete contracts
        await tx.contract.deleteMany({
          where: { bookingId: booking.id },
        });

        // Delete conversations
        await tx.conversation.deleteMany({
          where: { bookingId: booking.id },
        });
      }

      // Delete bookings
      await tx.booking.deleteMany({
        where: { serviceListingId: listingId },
      });

      // Delete booking proposals for this listing
      await tx.bookingProposal.deleteMany({
        where: { serviceListingId: listingId },
      });

      // Delete conversations for this listing
      await tx.conversation.deleteMany({
        where: { listingId: listingId },
      });

      // Delete reviews for this listing
      await tx.review.deleteMany({
        where: { serviceListingId: listingId },
      });

      // Finally, delete the service listing
      await tx.serviceListing.delete({
        where: { id: listingId },
      });
    });

    return NextResponse.json(
      { message: "Listing deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete listing", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listings/[id]
 * Update a listing and its portfolio item associations
 */
export async function PATCH(request, context) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (isNaN(listingId)) {
    return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
  }

  const body = await request.json();
  const {
    portfolioItemIds,
    serviceName,
    serviceDescription,
    categoryName,
    ...listingData
  } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear and add portfolio connection
      await tx.serviceListingPortfolioItem.deleteMany({
        where: { serviceListingId: listingId },
      });

      if (portfolioItemIds?.length > 0) {
        const selectedPortfolioItemId = Number(portfolioItemIds[0]);
        await tx.serviceListingPortfolioItem.create({
          data: {
            serviceListingId: listingId,
            portfolioItemId: selectedPortfolioItemId,
          },
        });
      }

      // 2. Update listing
      const updatedListing = await tx.serviceListing.update({
        where: { id: listingId },
        data: { ...listingData },
        include: { service: true },
      });

      // 3. Update related service (if needed)
      if (serviceName || serviceDescription || categoryName) {
        const serviceUpdateData = {
          ...(serviceName && { serviceName }),
          ...(serviceDescription && { description: serviceDescription }),
        };

        if (categoryName) {
          // Lookup category ID based on categoryName
          const category = await tx.category.findFirst({
            where: { categoryName },
          });

          if (!category) {
            throw new Error(`Category '${categoryName}' not found`);
          }

          serviceUpdateData["categoryId"] = category.id;
        }

        await tx.service.update({
          where: { id: updatedListing.serviceId },
          data: serviceUpdateData,
        });
      }

      return updatedListing;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/listings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update listing", details: error.message },
      { status: 500 }
    );
  }
}
