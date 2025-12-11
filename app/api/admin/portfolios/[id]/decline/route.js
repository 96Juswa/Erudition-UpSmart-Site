// app/api/admin/portfolios/[id]/decline/route.js

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

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
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
        action: "DECLINE_PORTFOLIO",
        targetType: "PORTFOLIO",
        targetId: parseInt(id),
        reason: reason,
        details: `Declined portfolio: ${portfolio.itemName}`,
        metadata: JSON.stringify({
          portfolioName: portfolio.itemName,
          resolverId: portfolio.resolverId,
          resolverName: `${portfolio.resolver.firstName} ${portfolio.resolver.lastName}`,
        }),
      },
    });

    console.log(`Portfolio ${id} declined by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Portfolio declined",
        portfolio: updatedPortfolio,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error declining portfolio:", err);
    return new Response(
      JSON.stringify({ message: "Failed to decline portfolio" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
