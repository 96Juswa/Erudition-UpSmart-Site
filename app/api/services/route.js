import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Fetch listings sorted by resolver trustRating (highest first)
    const listings = await prisma.serviceListing.findMany({
      where: {
        status: "approved", // Only approved listings
      },
      include: {
        resolver: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            resolverProfile: {
              select: {
                trustRating: true,
              },
            },
          },
        },
        service: {
          select: {
            serviceName: true,
            category: {
              select: {
                categoryName: true,
              },
            },
          },
        },
        reviews: true,
      },
      orderBy: {
        resolver: {
          resolverProfile: {
            trustRating: "desc", // Top trustRating first
          },
        },
      },
      ...(limit && { take: limit }), // Optional: limit number of listings returned
    });

    const topN = 10; // Top 10 listings will be featured

    const formatted = listings.map((listing, index) => ({
      id: listing.id.toString(),
      title: listing.title,
      description: listing.description || "",
      provider: `${listing.resolver.firstName} ${listing.resolver.lastName}`,
      minPrice: listing.minPrice?.toString() || "0",
      maxPrice: listing.maxPrice?.toString(),
      category: listing.service.category.categoryName,
      imageUrl: listing.serviceImage,
      profileImageUrl: listing.resolver?.profilePicture || null,
      location: listing.location === "onsite" ? "Onsite" : "Offsite",
      availability:
        listing.availabilityStatus?.charAt(0).toUpperCase() +
          listing.availabilityStatus?.slice(1) || "Unavailable",
      trustRating:
        listing.resolver.resolverProfile?.trustRating?.toFixed(1) || "0",
      isFeatured: index < topN, // Top 10 listings are featured
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
