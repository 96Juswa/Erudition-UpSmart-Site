// app/api/admin/listings/[id]/request-revision/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = params;
    const body = await req.json();
    const { revisionNotes } = body;

    if (!revisionNotes || revisionNotes.trim() === "") {
      return new Response(
        JSON.stringify({ message: "Revision notes are required" }),
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
          message: `Cannot request revision for ${listing.status.replace("_", " ")} listing`,
        }),
        { status: 400 }
      );
    }

    const updatedListing = await prisma.serviceListing.update({
      where: { id: parseInt(id) },
      data: {
        revisionRequested: true,
        revisionNotes: revisionNotes,
        reviewedById: admin.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: "REQUEST_LISTING_REVISION",
        targetType: "SERVICE_LISTING",
        targetId: parseInt(id),
        details: `Requested revision for listing: ${listing.title}`,
        metadata: JSON.stringify({
          listingTitle: listing.title,
          serviceName: listing.service.serviceName,
          categoryName: listing.service.category.categoryName,
          resolverId: listing.resolverId,
          resolverName: `${listing.resolver.firstName} ${listing.resolver.lastName}`,
          revisionNotes: revisionNotes,
        }),
      },
    });

    console.log(`Revision requested for listing ${id} by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Revision requested successfully",
        listing: updatedListing,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error requesting revision:", err);
    return new Response(
      JSON.stringify({ message: "Failed to request revision" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
