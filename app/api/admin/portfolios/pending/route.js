// app/api/admin/portfolios/pending/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const pendingPortfolios = await prisma.portfolio.findMany({
      where: {
        status: "PENDING_APPROVAL",
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
        portfolios: pendingPortfolios,
        count: pendingPortfolios.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching pending portfolios:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch portfolios" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
