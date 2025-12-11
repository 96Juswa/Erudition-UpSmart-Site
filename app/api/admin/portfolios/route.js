// app/api/admin/portfolios/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING_APPROVAL, APPROVED, REJECTED
    const resolverId = searchParams.get("resolverId");
    const categoryId = searchParams.get("categoryId");

    const where = {};

    if (status) where.status = status;
    if (resolverId) where.resolverId = parseInt(resolverId);
    if (categoryId) where.categoryId = parseInt(categoryId);

    const portfolios = await prisma.portfolio.findMany({
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
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },
        portfolioFiles: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        uploadDate: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        portfolios,
        count: portfolios.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching portfolios:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch portfolios" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
