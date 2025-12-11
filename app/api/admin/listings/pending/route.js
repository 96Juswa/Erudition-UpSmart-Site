// app/api/admin/listings/pending/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const pendingListings = await prisma.serviceListing.findMany({
      where: {
        status: "on_review",
      },
      include: {
        resolver: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        service: {
          include: {
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        listings: pendingListings,
        count: pendingListings.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching pending listings:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch listings" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
