// app/api/messages/threads/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Messages API - Current user ID:", user.userId);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.userId } },
      },
      include: {
        participants: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            program: true, // Add this
            yearStarted: true,
            clientProfile: true,
            resolverProfile: true,
          },
        },
        messages: {
          orderBy: { sentDate: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        listing: {
          include: {
            resolver: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                program: true, // Add this
                yearStarted: true,
              },
            },
            service: { include: { category: true } },
          },
        },
        request: {
          include: {
            client: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                program: true, // Add this
                yearStarted: true,
              },
            },
            category: true,
          },
        },
        // Include booking directly from conversation
        booking: {
          include: {
            client: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                program: true, // Add this
                yearStarted: true,
              },
            },
            serviceListing: {
              include: {
                resolver: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    program: true, // Add this
                    yearStarted: true,
                  },
                },
                service: { include: { category: true } },
              },
            },
            serviceRequest: {
              include: {
                client: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    program: true, // Add this
                    yearStarted: true,
                  },
                },
                category: true,
              },
            },
            latestProposal: {
              include: {
                sender: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    program: true, // Add this
                    yearStarted: true,
                  },
                },
                receiver: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    program: true, // Add this
                    yearStarted: true,
                  },
                },
              },
            },
            progressUpdates: {
              orderBy: { createdAt: "desc" },
              take: 3,
              include: {
                updater: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            changeRequests: {
              orderBy: { createdAt: "desc" },
              include: {
                requester: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Filter and clean up data for current user
    const processedConversations = conversations.map((conv) => {
      // Debug logging for booking visibility

      // Only show latestProposal if current user is involved
      if (conv.booking?.latestProposal) {
        const proposal = conv.booking.latestProposal;
        if (
          proposal.senderId !== user.userId &&
          proposal.receiverId !== user.userId
        ) {
          conv.booking.latestProposal = null;
        }
      }

      // Ensure booking belongs to current user - FIXED for Flow B
      if (conv.booking) {
        const isUserInvolved =
          conv.booking.clientId === user.userId || // Client in both flows
          conv.booking.serviceListing?.resolverId === user.userId || // Resolver in Flow A
          conv.booking.serviceRequest?.clientId === user.userId || // Client in Flow B (duplicate but safe)
          conv.booking.latestProposal?.senderId === user.userId || // Resolver in Flow B (who sent the accepted proposal)
          conv.booking.latestProposal?.receiverId === user.userId; // Additional safety check

        if (!isUserInvolved) {
          console.log(
            "Hiding booking from user",
            user.userId,
            "for booking",
            conv.booking.id
          );
          conv.booking = null;
        }
      }

      return conv;
    });

    // Sort by most recent activity
    const sortedConversations = processedConversations.sort((a, b) => {
      const getLatestTimestamp = (conv) => {
        const timestamps = [];

        if (conv.messages?.[0]?.sentDate) {
          timestamps.push(new Date(conv.messages[0].sentDate));
        }

        if (conv.booking?.latestProposal?.updatedAt) {
          timestamps.push(new Date(conv.booking.latestProposal.updatedAt));
        }

        if (conv.createdAt) {
          timestamps.push(new Date(conv.createdAt));
        }

        return timestamps.length > 0
          ? Math.max(...timestamps.map((t) => t.getTime()))
          : 0;
      };

      return getLatestTimestamp(b) - getLatestTimestamp(a);
    });

    return NextResponse.json(sortedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
