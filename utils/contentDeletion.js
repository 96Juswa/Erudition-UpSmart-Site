// utils/contentDeletion.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Delete or hide content based on type
 * This function handles the actual deletion logic for different content types
 */
export async function handleContentDeletion(report, adminId, reason) {
  const results = {
    deleted: [],
    errors: [],
  };

  try {
    // Based on the report, determine what content to delete
    // You'll need to expand this based on your needs

    // Example: Delete user's inappropriate listings
    const userListings = await prisma.serviceListing.findMany({
      where: {
        resolverId: report.reportedUserId,
        status: "approved", // Only affect approved listings
      },
    });

    for (const listing of userListings) {
      try {
        await prisma.serviceListing.update({
          where: { id: listing.id },
          data: {
            status: "rejected",
            adminNotes: `Content removed due to report #${report.id}: ${reason}`,
          },
        });

        // Create content flag for tracking
        await prisma.contentFlag.create({
          data: {
            reportId: report.id,
            flaggedType: "SERVICE_LISTING",
            flaggedId: listing.id,
            flaggedBy: adminId,
            reason: reason,
            status: "RESOLVED",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            resolution: "Content hidden from public view",
          },
        });

        results.deleted.push({
          type: "SERVICE_LISTING",
          id: listing.id,
          title: listing.title,
        });
      } catch (err) {
        results.errors.push({
          type: "SERVICE_LISTING",
          id: listing.id,
          error: err.message,
        });
      }
    }

    // Delete user's portfolios
    const userPortfolios = await prisma.portfolio.findMany({
      where: {
        resolverId: report.reportedUserId,
        status: "APPROVED",
      },
    });

    for (const portfolio of userPortfolios) {
      try {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            status: "REJECTED",
            adminNotes: `Content removed due to report #${report.id}: ${reason}`,
          },
        });

        await prisma.contentFlag.create({
          data: {
            reportId: report.id,
            flaggedType: "PORTFOLIO",
            flaggedId: portfolio.id,
            flaggedBy: adminId,
            reason: reason,
            status: "RESOLVED",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            resolution: "Portfolio hidden from public view",
          },
        });

        results.deleted.push({
          type: "PORTFOLIO",
          id: portfolio.id,
          name: portfolio.itemName,
        });
      } catch (err) {
        results.errors.push({
          type: "PORTFOLIO",
          id: portfolio.id,
          error: err.message,
        });
      }
    }

    // Delete inappropriate comments
    const userComments = await prisma.comment.findMany({
      where: {
        commenterId: report.reportedUserId,
      },
    });

    for (const comment of userComments) {
      try {
        // Soft delete by updating content
        await prisma.comment.update({
          where: { id: comment.id },
          data: {
            commentContent: "[This comment has been removed by moderators]",
          },
        });

        await prisma.contentFlag.create({
          data: {
            reportId: report.id,
            flaggedType: "COMMENT",
            flaggedId: comment.id,
            flaggedBy: adminId,
            reason: reason,
            status: "RESOLVED",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            resolution: "Comment content removed",
          },
        });

        results.deleted.push({
          type: "COMMENT",
          id: comment.id,
        });
      } catch (err) {
        results.errors.push({
          type: "COMMENT",
          id: comment.id,
          error: err.message,
        });
      }
    }

    // Delete user's reviews if inappropriate
    const userReviews = await prisma.review.findMany({
      where: {
        reviewerId: report.reportedUserId,
      },
    });

    for (const review of userReviews) {
      try {
        await prisma.review.update({
          where: { id: review.id },
          data: {
            reviewText: "[This review has been removed by moderators]",
            rating: 0, // Or you could delete the review entirely
          },
        });

        await prisma.contentFlag.create({
          data: {
            reportId: report.id,
            flaggedType: "REVIEW",
            flaggedId: review.id,
            flaggedBy: adminId,
            reason: reason,
            status: "RESOLVED",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            resolution: "Review content removed",
          },
        });

        results.deleted.push({
          type: "REVIEW",
          id: review.id,
        });
      } catch (err) {
        results.errors.push({
          type: "REVIEW",
          id: review.id,
          error: err.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error in content deletion:", error);
    throw error;
  }
}

/**
 * Delete specific content item (when you know exactly what to delete)
 */
export async function deleteSpecificContent(
  contentType,
  contentId,
  adminId,
  reason,
  reportId = null
) {
  try {
    let result = null;

    switch (contentType) {
      case "SERVICE_LISTING":
        result = await prisma.serviceListing.update({
          where: { id: contentId },
          data: {
            status: "rejected",
            adminNotes: `Content removed: ${reason}`,
          },
        });
        break;

      case "PORTFOLIO":
        result = await prisma.portfolio.update({
          where: { id: contentId },
          data: {
            status: "REJECTED",
            adminNotes: `Content removed: ${reason}`,
          },
        });
        break;

      case "COMMENT":
        result = await prisma.comment.update({
          where: { id: contentId },
          data: {
            commentContent: "[This comment has been removed by moderators]",
          },
        });
        break;

      case "REVIEW":
        result = await prisma.review.update({
          where: { id: contentId },
          data: {
            reviewText: "[This review has been removed by moderators]",
          },
        });
        break;

      case "SERVICE_REQUEST":
        result = await prisma.serviceRequest.update({
          where: { id: contentId },
          data: {
            status: "DELETED",
            description:
              "[This service request has been removed by moderators]",
          },
        });
        break;

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    // Create content flag
    await prisma.contentFlag.create({
      data: {
        reportId: reportId,
        flaggedType: contentType,
        flaggedId: contentId,
        flaggedBy: adminId,
        reason: reason,
        status: "RESOLVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resolution: "Content removed or hidden",
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("Error deleting specific content:", error);
    throw error;
  }
}
