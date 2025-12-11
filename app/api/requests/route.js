import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import { getCurrentUser } from "../../lib/getCurrentUser";

export async function GET() {
  try {
    const serviceRequests = await prisma.serviceRequest.findMany({
      include: {
        category: true,
        client: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            clientProfile: {
              select: {
                trustRating: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedDate: "desc",
      },
    });

    return NextResponse.json(serviceRequests, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch service requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, deadline, minPrice, maxPrice, categoryId } =
      body;

    if (
      !title ||
      !description ||
      !deadline ||
      !minPrice ||
      !maxPrice ||
      !categoryId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newRequest = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        minPrice: parseFloat(minPrice),
        maxPrice: parseFloat(maxPrice),
        status: "Open",
        clientId: user.userId,
        categoryId: parseInt(categoryId), // ✅ ensure it's an integer
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            clientProfile: {
              select: {
                trustRating: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("❌ Failed to create service request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
