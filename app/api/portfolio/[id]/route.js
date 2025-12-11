import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "@/app/lib/cloudinary";

export const config = {
  api: {
    bodyParser: false,
  },
};

// ─────────────── PATCH /api/portfolio/[id] ───────────────
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioId = parseInt(params.id);
    const formData = await request.formData();

    const categoryName = formData.get("categoryName");
    const itemName = formData.get("itemName");
    const description = formData.get("description");
    const thumbnailIdentifier = formData.get("thumbnailUrl");

    const newFiles = formData.getAll("newFiles");
    const filesToRemove = JSON.parse(formData.get("filesToRemove") || "[]");
    const filesToKeep = JSON.parse(formData.get("filesToKeep") || "[]");

    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { portfolioFiles: true },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    if (existingPortfolio.resolverId !== currentUser.userId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't own this portfolio" },
        { status: 403 }
      );
    }

    // 🔸 Delete removed files
    for (const fileUrl of filesToRemove) {
      const publicId = getPublicIdFromUrl(fileUrl);
      if (publicId) await deleteFromCloudinary(publicId);

      await prisma.portfolioFile.deleteMany({
        where: { portfolioId, url: fileUrl },
      });
    }

    // 🔸 Upload new files
    const uploadedFiles = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!(file instanceof File) || file.size === 0) continue;
      if (!file.type.startsWith("image/")) continue;

      const folderName = categoryName.toLowerCase().replace(/\s+/g, "-");
      const result = await uploadToCloudinary(file, `portfolio/${folderName}`);

      const isNewThumbnail = thumbnailIdentifier === `NEW_FILE_${i}`;
      uploadedFiles.push({
        url: result.url,
        fileType: file.type.split("/")[0] || "image",
        order: filesToKeep.length + i,
        isThumbnail: isNewThumbnail,
      });
    }

    // 🔸 Update thumbnail for existing files
    if (thumbnailIdentifier && !thumbnailIdentifier.startsWith("NEW_FILE_")) {
      await prisma.portfolioFile.updateMany({
        where: { portfolioId },
        data: { isThumbnail: false },
      });
      await prisma.portfolioFile.updateMany({
        where: { portfolioId, url: thumbnailIdentifier },
        data: { isThumbnail: true },
      });
    }

    const category = await prisma.category.findUnique({
      where: { categoryName },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // 🔸 Determine new status
    let newStatus = existingPortfolio.status;
    if (existingPortfolio.status === "APPROVED") {
      newStatus = "PENDING_APPROVAL"; // mark approved portfolios as on_review after edit
    }

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        categoryId: category.id,
        itemName,
        description: description || "",
        updatedAt: new Date(),
        status: newStatus,
        portfolioFiles: { create: uploadedFiles },
      },
      include: {
        portfolioFiles: { orderBy: { order: "asc" } },
        category: true,
      },
    });

    // 🔹 --- NEW ADDITION ---
    // Trigger trust rating recalculation if portfolio is APPROVED
    if (updatedPortfolio.status === "APPROVED") {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/trust-rating/calculate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: updatedPortfolio.resolverId,
              role: "resolver",
            }),
          }
        );
        console.log(
          `⚡ Trust rating recalculation triggered for resolver ${updatedPortfolio.resolverId}`
        );
      } catch (err) {
        console.error("Failed to trigger trust rating recalculation:", err);
      }
    }
    // 🔹 --- END OF ADDITION ---

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error("[API][PORTFOLIO][PATCH] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

// ─────────────── DELETE /api/portfolio/[id] ───────────────
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioId = parseInt(params.id);

    // Get portfolio with files and listing associations
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        portfolioFiles: true,
        listingAssociations: {
          include: {
            serviceListing: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (portfolio.resolverId !== currentUser.userId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't own this portfolio" },
        { status: 403 }
      );
    }

    // Check if used in active listings (draft, on_review, approved)
    const activeListings = portfolio.listingAssociations
      .filter((la) =>
        ["draft", "on_review", "approved"].includes(la.serviceListing.status)
      )
      .map((la) => ({
        listingId: la.serviceListing.id,
        listingTitle: la.serviceListing.title,
      }));

    if (activeListings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete portfolio item used in active listings",
          listingPortfolios: activeListings,
        },
        { status: 400 }
      );
    }

    // 🔸 Delete files from Cloudinary
    for (const file of portfolio.portfolioFiles) {
      const publicId = getPublicIdFromUrl(file.url);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // 🔸 Delete ServiceListingPortfolioItem associations
    await prisma.serviceListingPortfolioItem.deleteMany({
      where: { portfolioItemId: portfolioId },
    });

    // 🔸 Delete portfolio files from database
    await prisma.portfolioFile.deleteMany({
      where: { portfolioId },
    });

    // 🔸 Delete the portfolio itself
    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    return NextResponse.json(
      { message: "Portfolio deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API][PORTFOLIO][DELETE] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
