import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

// ─────────────── GET /api/listings ───────────────
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.userId;

    const roles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const isResolver = roles.some((r) => r.role.roleName === "resolver");
    if (!isResolver) {
      return NextResponse.json(
        { error: "Forbidden: Resolver access only" },
        { status: 403 }
      );
    }

    const listings = await prisma.serviceListing.findMany({
      where: { resolverId: userId },
      include: {
        service: {
          include: { category: true },
        },
        resolver: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const formatted = listings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      minPrice: l.minPrice ?? 0,
      maxPrice: l.maxPrice ?? 0,
      status: l.status,
      thumbnail: l.serviceImage,
      category: l.service?.category?.categoryName ?? "Uncategorized",
      USERS: {
        name: `${l.resolver.firstName} ${l.resolver.lastName}`,
        email: l.resolver.email,
        profilePicture: l.resolver.profilePicture,
      },
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[API][LISTINGS][GET]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─────────────── POST /api/listings ───────────────
export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await prisma.userRole.findMany({
      where: { userId: currentUser.userId },
      include: { role: true },
    });

    const isResolver = roles.some((r) => r.role.roleName === "resolver");

    // 🟡 If not yet a resolver, assign resolver role
    if (!isResolver) {
      const resolverRole = await prisma.role.findUnique({
        where: { roleName: "resolver" },
      });

      if (resolverRole) {
        await prisma.userRole.create({
          data: {
            userId: currentUser.userId,
            roleId: resolverRole.roleId,
          },
        });

        // 🔹 Create default resolver profile if it doesn't exist
        const existingProfile = await prisma.resolverProfile.findUnique({
          where: { userId: currentUser.userId },
        });

        if (!existingProfile) {
          await prisma.resolverProfile.create({
            data: {
              userId: currentUser.userId,
              bio: "",
              skills: "",
            },
          });
        }
      }
    }

    const body = await req.json();
    const {
      serviceName,
      serviceDescription,
      categoryName,
      status,
      serviceImage,
    } = body;

    if (!serviceName || !serviceDescription || !categoryName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Step 1: Get category by name
    const category = await prisma.category.findUnique({
      where: { categoryName },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category name" },
        { status: 400 }
      );
    }

    // Step 2: Create the service first
    const newService = await prisma.service.create({
      data: {
        categoryId: category.id,
        serviceName,
        description: serviceDescription,
      },
    });

    // Step 3: Create the service listing
    const newListing = await prisma.serviceListing.create({
      data: {
        title: serviceName,
        description: serviceDescription,
        status: status ?? "draft",
        resolverId: currentUser.userId,
        serviceId: newService.id,
        serviceImage: serviceImage || "images/default-image.jpg",
      },
    });

    return NextResponse.json({ id: newListing.id });
  } catch (err) {
    console.error("[API][LISTINGS][POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
