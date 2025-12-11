// app/api/admin/portfolios/[id]/approve/route.js

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

    // Check if portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: parseInt(id) },
      include: {
        resolver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!portfolio) {
      return new Response(JSON.stringify({ message: "Portfolio not found" }), {
        status: 404,
      });
    }

    if (portfolio.status !== "PENDING_APPROVAL") {
      return new Response(
        JSON.stringify({
          message: `Portfolio is already ${portfolio.status.toLowerCase().replace("_", " ")}`,
        }),
        { status: 400 }
      );
    }

    // Update portfolio
    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: parseInt(id) },
      data: {
        status: "APPROVED",
        reviewedById: admin.userId,
        reviewedAt: new Date(),
        adminNotes: notes || null,
        revisionRequested: false,
        revisionNotes: null,
      },
    });

    // Log admin action (audit trail)
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: "APPROVE_PORTFOLIO",
        targetType: "PORTFOLIO",
        targetId: parseInt(id),
        details: `Approved portfolio: ${portfolio.itemName}`,
        metadata: JSON.stringify({
          portfolioName: portfolio.itemName,
          resolverId: portfolio.resolverId,
          resolverName: `${portfolio.resolver.firstName} ${portfolio.resolver.lastName}`,
          notes: notes || null,
        }),
      },
    });

    console.log(`Portfolio ${id} approved by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Portfolio approved successfully",
        portfolio: updatedPortfolio,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error approving portfolio:", err);
    return new Response(
      JSON.stringify({ message: "Failed to approve portfolio" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
