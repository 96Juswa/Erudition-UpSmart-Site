import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req, context) {
  const { listingId } = await context.params;
  try {
    const portfolioItems = await prisma.serviceListing.findUnique({
      where: {
        id: parseInt(listingId, 10),
      },
      include: {
        associatedPortfolios: {
          include: {
            portfolioItem: {
              include: {
                portfolioFiles: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!portfolioItems) {
      return new NextResponse("Service listing not found", { status: 404 });
    }

    // Format portfolio items correctly
    const formatted = portfolioItems.associatedPortfolios.map((assoc) => ({
      id: assoc.portfolioItem.id,
      itemName: assoc.portfolioItem.itemName,
      description: assoc.portfolioItem.description,
      uploadDate: assoc.portfolioItem.uploadDate,
      files: assoc.portfolioItem.portfolioFiles.map((file) => ({
        id: file.id,
        url: file.url,
        type: file.fileType,
        isThumbnail: file.isThumbnail,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching portfolio items:", error);
    return new NextResponse("Failed to fetch portfolio items", { status: 500 });
  }
}
