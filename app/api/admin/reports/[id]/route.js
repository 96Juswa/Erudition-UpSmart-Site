// app/api/admin/reports/[id]/route.js

import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: {
        reporter: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            createdAt: true,
          },
        },
        reportedUser: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            createdAt: true,
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
    });

    if (!report) {
      return new Response(JSON.stringify({ message: "Report not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ report }), { status: 200 });
  } catch (err) {
    console.error("Error fetching report:", err);
    return new Response(JSON.stringify({ message: "Failed to fetch report" }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}
