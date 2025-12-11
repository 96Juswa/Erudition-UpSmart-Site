// app/api/messages/start/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  try {
    const { receiverId, listingId, requestId } = await req.json();

    const user = await getCurrentUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    if (!listingId && !requestId) {
      return new Response(
        "Must provide listingId or requestId to start a conversation",
        { status: 400 }
      );
    }

    // Determine initiator type
    let initiatorType;
    const userRoles = user.userRoles.map((r) => r.roleName);
    if (userRoles.includes("admin")) initiatorType = "ADMIN";
    else if (userRoles.includes("resolver")) initiatorType = "RESOLVER";
    else initiatorType = "CLIENT";

    // Check for existing conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { listingId: listingId ? Number(listingId) : undefined },
          { requestId: requestId ? Number(requestId) : undefined },
        ],
        participants: {
          every: {
            userId: {
              in: [user.userId, receiverId],
            },
          },
        },
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ conversationId: existing.conversationId }),
        { status: 200 }
      );
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        initiatedById: user.userId,
        initiatedByType: initiatorType,
        listingId: listingId ? Number(listingId) : null,
        requestId: requestId ? Number(requestId) : null,
        participants: {
          connect: [{ userId: user.userId }, { userId: receiverId }],
        },
      },
    });

    return new Response(
      JSON.stringify({ conversationId: newConversation.conversationId }),
      { status: 201 }
    );
  } catch (err) {
    console.error("[API][MESSAGES][START]", err);
    return new Response(
      JSON.stringify({
        error: "Failed to start conversation",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}
