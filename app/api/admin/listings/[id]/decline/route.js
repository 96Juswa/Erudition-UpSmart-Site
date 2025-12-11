// app/api/admin/listings/[id]/decline/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      return new Response(
        JSON.stringify({ message: "Reason for decline is required" }),
        { status: 400 }
      );
    }

    const listing = await prisma.serviceListing.findUnique({
      where: { id: parseInt(id) },
      include: {
        resolver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!listing) {
      return new Response(
        JSON.stringify({ message: "Service listing not found" }),
        { status: 404 }
      );
    }

    if (listing.status !== "on_review") {
      return new Response(
        JSON.stringify({
          message: `Listing is already ${listing.status.replace("_", " ")}`,
        }),
        { status: 400 }
      );
    }

    const updatedListing = await prisma.serviceListing.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejected",
        reviewedById: admin.userId,
        reviewedAt: new Date(),
        adminNotes: reason,
        revisionRequested: false,
        revisionNotes: null,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: "DECLINE_LISTING",
        targetType: "SERVICE_LISTING",
        targetId: parseInt(id),
        reason: reason,
        details: `Declined listing: ${listing.title}`,
        metadata: JSON.stringify({
          listingTitle: listing.title,
          serviceName: listing.service.serviceName,
          categoryName: listing.service.category.categoryName,
          resolverId: listing.resolverId,
          resolverName: `${listing.resolver.firstName} ${listing.resolver.lastName}`,
        }),
      },
    });

    console.log(`Listing ${id} declined by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Service listing declined",
        listing: updatedListing,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error declining listing:", err);
    return new Response(
      JSON.stringify({ message: "Failed to decline listing" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
