import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

export async function GET(_, { params }) {
  const { requestId } = await params;

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        client: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            clientProfile: {
              select: { trustRating: true },
            },
          },
        },
        category: {
          select: {
            categoryName: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("❌ Failed to fetch request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  const { requestId } = params;

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user || !user.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: parseInt(requestId) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existing.clientId !== user.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // Check for dependencies before deleting
    const [bookingCount, proposalCount, conversationCount] = await Promise.all([
      prisma.booking.count({
        where: { serviceRequestId: parseInt(requestId) },
      }),
      prisma.bookingProposal.count({
        where: { serviceRequestId: parseInt(requestId) },
      }),
      prisma.conversation.count({
        where: { requestId: parseInt(requestId) },
      }),
    ]);

    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete request with existing bookings",
          details: `This request has ${bookingCount} associated booking(s)`,
        },
        { status: 400 }
      );
    }

    if (proposalCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete request with pending proposals",
          details: `This request has ${proposalCount} proposal(s)`,
        },
        { status: 400 }
      );
    }

    if (conversationCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete request with active conversations",
          details: `This request has ${conversationCount} conversation(s)`,
        },
        { status: 400 }
      );
    }

    // Safe to delete
    await prisma.serviceRequest.delete({
      where: { id: parseInt(requestId) },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const { requestId } = params;
  const user = await getCurrentUser();

  if (!user || !user.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  try {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: parseInt(requestId) },
    });

    if (!existing || existing.clientId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        title: data.title,
        description: data.description,
        minPrice: parseFloat(data.minPrice),
        maxPrice: parseFloat(data.maxPrice),
        deadline: new Date(data.deadline),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
