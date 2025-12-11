// app/api/admin/listings/[id]/approve/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = params;
    const body = await req.json();
    const { notes } = body;

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
        status: "approved",
        reviewedById: admin.userId,
        reviewedAt: new Date(),
        adminNotes: notes || null,
        revisionRequested: false,
        revisionNotes: null,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: "APPROVE_LISTING",
        targetType: "SERVICE_LISTING",
        targetId: parseInt(id),
        details: `Approved listing: ${listing.title}`,
        metadata: JSON.stringify({
          listingTitle: listing.title,
          serviceName: listing.service.serviceName,
          categoryName: listing.service.category.categoryName,
          resolverId: listing.resolverId,
          resolverName: `${listing.resolver.firstName} ${listing.resolver.lastName}`,
          notes: notes || null,
        }),
      },
    });

    console.log(`Listing ${id} approved by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Service listing approved successfully",
        listing: updatedListing,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error approving listing:", err);
    return new Response(
      JSON.stringify({ message: "Failed to approve listing" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
