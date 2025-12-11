// app/api/messages/[conversationId]/mark-read/route.js

import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const conversationId = Number(params.conversationId);
    if (!conversationId || isNaN(conversationId)) {
      return new NextResponse("Invalid conversation ID", { status: 400 });
    }

    // Example logic: mark all messages sent to current user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: user.userId,
        readStatus: false, // ✅ correct field
      },
      data: {
        readStatus: true, // ✅ correct field
      },
    });

    return new NextResponse("Messages marked as read", { status: 200 });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
