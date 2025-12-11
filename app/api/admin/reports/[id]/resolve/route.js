import { requireAdmin } from "@/middleware/adminAuth";
import { PrismaClient } from "@prisma/client";
import { handleContentDeletion } from "@/utils/contentDeletion";

const prisma = new PrismaClient();

export async function POST(req, context) {
  const { params } = context;
  const { id } = await params; // ✅ Fix #1 — await params

  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { action, resolution, reason, duration } = body;

    // Validation
    if (!action) {
      return new Response(JSON.stringify({ message: "Action is required" }), {
        status: 400,
      });
    }

    if (!resolution || resolution.trim() === "") {
      return new Response(
        JSON.stringify({ message: "Resolution notes are required" }),
        { status: 400 }
      );
    }

    // Fetch report with related data
    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: {
        reporter: true,
        reportedUser: true,
      },
    });

    if (!report) {
      return new Response(JSON.stringify({ message: "Report not found" }), {
        status: 404,
      });
    }

    if (["RESOLVED", "DISMISSED"].includes(report.status)) {
      return new Response(
        JSON.stringify({ message: "Report is already resolved" }),
        { status: 400 }
      );
    }

    // ✅ Fix #2: Only DB operations inside transaction
    const updatedReport = await prisma.$transaction(async (tx) => {
      return await tx.report.update({
        where: { id: parseInt(id) },
        data: {
          status: action === "DISMISS" ? "DISMISSED" : "RESOLVED",
          resolution,
          adminId: admin.userId,
        },
      });
    });

    // ✅ Run slower logic *after* transaction
    switch (action) {
      case "WARNING":
        await prisma.userModeration.create({
          data: {
            userId: report.reportedUserId,
            moderatedBy: admin.userId,
            action: "WARNING",
            reason: reason || resolution,
            notes: `Related to report #${report.id}: ${report.reportTitle}`,
          },
        });

        await prisma.adminAction.create({
          data: {
            adminId: admin.userId,
            action: "WARN_USER",
            targetType: "USER",
            targetId: report.reportedUserId,
            reason: reason || resolution,
            details: `Warned user for report: ${report.reportTitle}`,
            metadata: JSON.stringify({
              reportId: report.id,
              reportTitle: report.reportTitle,
              reportedUserName: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`,
            }),
          },
        });
        break;

      case "SUSPEND_USER":
        const suspensionDays = duration || 7;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + suspensionDays);

        await prisma.userModeration.create({
          data: {
            userId: report.reportedUserId,
            moderatedBy: admin.userId,
            action: "TEMPORARY_SUSPENSION",
            reason: reason || resolution,
            endDate,
            notes: `Suspended for ${suspensionDays} days. Related to report #${report.id}`,
          },
        });

        await prisma.adminAction.create({
          data: {
            adminId: admin.userId,
            action: "SUSPEND_USER",
            targetType: "USER",
            targetId: report.reportedUserId,
            reason: reason || resolution,
            details: `Suspended user for ${suspensionDays} days for report: ${report.reportTitle}`,
            metadata: JSON.stringify({
              reportId: report.id,
              reportTitle: report.reportTitle,
              reportedUserName: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`,
              suspensionDays,
              endDate: endDate.toISOString(),
            }),
          },
        });
        break;

      case "DELETE_CONTENT":
        const deletionResults = await handleContentDeletion(
          report,
          admin.userId,
          reason || resolution
        );

        await prisma.adminAction.create({
          data: {
            adminId: admin.userId,
            action: "DELETE_CONTENT",
            targetType: "USER",
            targetId: report.reportedUserId,
            reason: reason || resolution,
            details: `Deleted content based on report: ${report.reportTitle}`,
            metadata: JSON.stringify({
              reportId: report.id,
              reportTitle: report.reportTitle,
              reportedUserName: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`,
              deletionSummary: {
                deleted: deletionResults.deleted.length,
                errors: deletionResults.errors.length,
                items: deletionResults.deleted,
              },
            }),
          },
        });
        break;

      case "DISMISS":
        await prisma.adminAction.create({
          data: {
            adminId: admin.userId,
            action: "RESOLVE_REPORT",
            targetType: "REPORT",
            targetId: report.id,
            reason: resolution,
            details: `Dismissed report: ${report.reportTitle}`,
            metadata: JSON.stringify({
              reportId: report.id,
              reportTitle: report.reportTitle,
              action: "DISMISS",
            }),
          },
        });
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    console.log(
      `Report ${id} resolved by admin ${admin.email} with action: ${action}`
    );

    return new Response(
      JSON.stringify({
        message: `Report resolved successfully with action: ${action}`,
        report: updatedReport,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error resolving report:", err);
    return new Response(
      JSON.stringify({
        message: "Failed to resolve report",
        error: err.message,
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
