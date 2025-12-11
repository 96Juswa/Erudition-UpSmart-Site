import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/app/lib/cloudinary";

export const config = {
  api: {
    bodyParser: false,
  },
};

// ─────────────── GET /api/portfolio ───────────────
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolverId = currentUser.userId;

    const portfolioItems = await prisma.portfolio.findMany({
      where: {
        resolverId,
      },
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
        portfolioFiles: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        uploadDate: "desc",
      },
    });

    return NextResponse.json(portfolioItems, { status: 200 });
  } catch (error) {
    console.error(
      "[API][PORTFOLIO][GET] Failed to fetch portfolio items:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch portfolio items." },
      { status: 500 }
    );
  }
}

// ─────────────── POST /api/portfolio ───────────────
export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized: User not logged in." },
        { status: 401 }
      );
    }

    const resolverId = currentUser.userId;
    const formData = await req.formData();

    const categoryName = formData.get("categoryName");
    const itemName = formData.get("itemName");
    const description = formData.get("description") || null;
    const thumbnailUrl = formData.get("thumbnailUrl") || "";

    if (!categoryName || !itemName) {
      return NextResponse.json(
        { error: "Category and Portfolio Title are required." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { categoryName },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: `Category "${categoryName}" not found.` },
        { status: 400 }
      );
    }

    const newFiles = formData.getAll("newFiles");
    const uploadedFiles = [];
    const uploadedPublicIds = []; // Track for cleanup on error

    // 🔸 Upload all files to Cloudinary
    try {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        if (!(file instanceof File) || file.size === 0) {
          continue;
        }

        if (!file.type.startsWith("image/")) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Upload to Cloudinary
        const folderName = categoryName.toLowerCase().replace(/\s+/g, "-");
        const result = await uploadToCloudinary(
          file,
          `portfolio/${folderName}`
        );

        uploadedPublicIds.push(result.publicId);

        uploadedFiles.push({
          url: result.url,
          fileType: file.type.split("/")[0] || "image",
          order: i,
          isThumbnail: false, // Will be set after creation
        });
      }
    } catch (uploadError) {
      console.error("[API][PORTFOLIO][POST] Upload error:", uploadError);

      // Cleanup: Delete already uploaded files from Cloudinary
      for (const publicId of uploadedPublicIds) {
        await deleteFromCloudinary(publicId);
      }

      return NextResponse.json(
        { error: "Failed to upload images to cloud storage." },
        { status: 500 }
      );
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one image file for the portfolio." },
        { status: 400 }
      );
    }

    // 🔸 Create portfolio with files
    const newPortfolio = await prisma.portfolio.create({
      data: {
        resolverId,
        categoryId: category.id,
        itemName,
        description,
        status: "PENDING_APPROVAL",
        updatedAt: new Date(),
        portfolioFiles: {
          create: uploadedFiles,
        },
      },
      include: {
        portfolioFiles: true,
        category: { select: { categoryName: true } },
      },
    });

    // 🔸 Set thumbnail after creation
    let finalThumbnailUrl = null;

    if (thumbnailUrl && thumbnailUrl.startsWith("NEW_FILE_")) {
      const fileIndex = parseInt(thumbnailUrl.split("_")[2]);
      if (fileIndex >= 0 && fileIndex < uploadedFiles.length) {
        finalThumbnailUrl = uploadedFiles[fileIndex].url;
      }
    }

    // If no specific thumbnail selected, use first file as thumbnail
    if (!finalThumbnailUrl && uploadedFiles.length > 0) {
      finalThumbnailUrl = uploadedFiles[0].url;
    }

    // Update the thumbnail in database
    if (finalThumbnailUrl) {
      await prisma.portfolioFile.updateMany({
        where: {
          portfolioId: newPortfolio.id,
          url: finalThumbnailUrl,
        },
        data: { isThumbnail: true },
      });
    }

    // 🔸 Fetch updated portfolio with thumbnail info
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: newPortfolio.id },
      include: {
        portfolioFiles: {
          orderBy: {
            order: "asc",
          },
        },
        category: { select: { categoryName: true } },
      },
    });

    return NextResponse.json(updatedPortfolio, { status: 201 });
  } catch (error) {
    console.error(
      "[API][PORTFOLIO][POST] Error creating portfolio item:",
      error
    );
    return NextResponse.json(
      { error: "Failed to create portfolio item." },
      { status: 500 }
    );
  }
}
