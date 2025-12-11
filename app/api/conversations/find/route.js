import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get("userId"));
    const otherUserId = parseInt(searchParams.get("otherUserId"));
    const listingId = searchParams.get("listingId");
    const requestId = searchParams.get("requestId");

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Build where clause
    const where = {
      participants: {
        some: {
          userId: { in: [userId, otherUserId] },
        },
      },
    };

    // Add context filters if provided
    if (listingId) where.listingId = parseInt(listingId);
    if (requestId) where.requestId = parseInt(requestId);

    // Find existing conversation
    const conversation = await prisma.conversation.findFirst({
      where,
      include: {
        participants: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        listing: {
          include: {
            service: { include: { category: true } },
            resolver: true,
          },
        },
        request: {
          include: {
            category: true,
            client: true,
          },
        },
        booking: true,
      },
    });

    if (conversation) {
      return NextResponse.json({ conversation });
    } else {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error finding conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
