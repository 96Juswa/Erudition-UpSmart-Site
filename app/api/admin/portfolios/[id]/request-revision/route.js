// app/api/admin/portfolios/[id]/request-revision/route.js

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
          message: `Cannot request revision for ${portfolio.status.toLowerCase().replace("_", " ")} portfolio`,
        }),
        { status: 400 }
      );
    }

    const updatedPortfolio = await prisma.portfolio.update({
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
        action: "REQUEST_PORTFOLIO_REVISION",
        targetType: "PORTFOLIO",
        targetId: parseInt(id),
        details: `Requested revision for portfolio: ${portfolio.itemName}`,
        metadata: JSON.stringify({
          portfolioName: portfolio.itemName,
          resolverId: portfolio.resolverId,
          resolverName: `${portfolio.resolver.firstName} ${portfolio.resolver.lastName}`,
          revisionNotes: revisionNotes,
        }),
      },
    });

    console.log(
      `Revision requested for portfolio ${id} by admin ${admin.email}`
    );

    return new Response(
      JSON.stringify({
        message: "Revision requested successfully",
        portfolio: updatedPortfolio,
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
