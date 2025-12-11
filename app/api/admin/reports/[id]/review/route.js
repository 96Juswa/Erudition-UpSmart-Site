// app/api/admin/reports/[id]/review/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
    });

    if (!report) {
      return new Response(JSON.stringify({ message: "Report not found" }), {
        status: 404,
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: {
        status: "UNDER_REVIEW",
        adminId: admin.userId,
      },
    });

    console.log(`Report ${id} marked as under review by admin ${admin.email}`);

    return new Response(
      JSON.stringify({
        message: "Report marked as under review",
        report: updatedReport,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating report status:", err);
    return new Response(
      JSON.stringify({ message: "Failed to update report" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
