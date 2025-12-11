// app/api/admin/reports/pending/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const pendingReports = await prisma.report.findMany({
      where: {
        status: "PENDING",
      },
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
      },
      orderBy: {
        reportDate: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        reports: pendingReports,
        count: pendingReports.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching pending reports:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch reports" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
