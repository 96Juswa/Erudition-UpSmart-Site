// =======================================================
// File Path: app/api/portfolio/by-category/route.js
// This is the API route. It must be a server component.
// It should NOT have "use client" or any React hooks.
// =======================================================
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req) {
  try {
    // 1. Extract the 'category' query parameter from the URL.
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get("category");

    if (!categoryName) {
      return NextResponse.json(
        { error: "Category parameter is required." },
        { status: 400 }
      );
    }

    // 2. Find the category by name to get its ID.
    const category = await prisma.category.findUnique({
      where: { categoryName: categoryName },
    });

    if (!category) {
      // Return a 200 with an empty array if no category is found
      return NextResponse.json([]);
    }

    // 3. Fetch portfolios associated with the found category ID.
    const portfolios = await prisma.portfolio.findMany({
      where: {
        categoryId: category.id,
        status: "APPROVED",
      },
      include: {
        portfolioFiles: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    console.error("Error fetching portfolios by category:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
