// app/api/messages/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    if (!conversationId)
      return new NextResponse("Missing conversationId", { status: 400 });

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      orderBy: { sentDate: "asc" },
    });

    // Convert sentDate to ISO string for reliable JS parsing
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      createdAt: msg.sentDate.toISOString(),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { conversationId, messageContent } = await req.json();
    if (!conversationId || !messageContent)
      return new NextResponse("Missing conversationId or messageContent", {
        status: 400,
      });

    const conversation = await prisma.conversation.findUnique({
      where: { conversationId: parseInt(conversationId) },
      include: { participants: { select: { userId: true } } },
    });

    if (!conversation)
      return new NextResponse("Conversation not found", { status: 404 });

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== user.userId
    );

    if (!otherParticipant)
      return new NextResponse("Conversation has no other participant", {
        status: 400,
      });

    const newMessage = await prisma.message.create({
      data: {
        conversationId: parseInt(conversationId),
        senderId: user.userId,
        messageContent: messageContent,
        receiverId: otherParticipant.userId,
      },
    });

    // Convert sentDate to ISO string for frontend
    const formattedMessage = {
      ...newMessage,
      createdAt: newMessage.sentDate.toISOString(),
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
