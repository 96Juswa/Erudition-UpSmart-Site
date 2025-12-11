// app/api/admin/listings/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // draft, on_review, approved, rejected
    const resolverId = searchParams.get("resolverId");
    const categoryId = searchParams.get("categoryId");

    const where = {};

    if (status) where.status = status;
    if (resolverId) where.resolverId = parseInt(resolverId);
    if (categoryId) {
      where.service = {
        categoryId: parseInt(categoryId),
      };
    }

    const listings = await prisma.serviceListing.findMany({
      where,
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
        listings,
        count: listings.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching listings:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch listings" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
