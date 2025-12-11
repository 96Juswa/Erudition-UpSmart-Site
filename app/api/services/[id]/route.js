import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const service = await prisma.serviceListing.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        title: true,
        description: true,
        minPrice: true,
        maxPrice: true,
        serviceImage: true,
        availabilityStatus: true,
        location: true,
        resolverId: true, // ✅ <-- this is needed
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
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const trustRating =
      service.resolver.resolverProfile?.trustRating?.toFixed(1) ?? "0";

    return NextResponse.json({
      id: service.id.toString(),
      title: service.title,
      description: service.description,
      provider: `${service.resolver.firstName} ${service.resolver.lastName.charAt(0)}.`,
      minPrice: service.minPrice?.toString(),
      maxPrice: service.maxPrice?.toString(),
      category: service.service.category.categoryName,
      imageUrl: service.serviceImage,
      profileImageUrl: service.resolver.profilePicture,
      location: service.location === "onsite" ? "Onsite" : "Offsite",
      availability:
        service.availabilityStatus?.charAt(0).toUpperCase() +
          service.availabilityStatus?.slice(1) || "Unavailable",
      trustRating,
      resolverId: service.resolverId,
    });
  } catch (err) {
    console.error("Error fetching service detail:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
