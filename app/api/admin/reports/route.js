// app/api/admin/reports/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, UNDER_REVIEW, RESOLVED, DISMISSED
    const reporterId = searchParams.get("reporterId");
    const reportedUserId = searchParams.get("reportedUserId");

    const where = {};

    if (status) where.status = status;
    if (reporterId) where.reporterId = parseInt(reporterId);
    if (reportedUserId) where.reportedUserId = parseInt(reportedUserId);

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        reportedUser: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        admin: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        reportDate: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        reports,
        count: reports.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching reports:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch reports" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
