// app/api/booking-proposals/respond/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      proposalId,
      action, // "accept", "decline", "counter", "new"
      declineReason,
      description,
      price,
      deadline,
      newStartDate,
      attachment,
      context = "listing",
      currentUserId,
    } = await request.json();

    console.log("Respond API called with:", {
      proposalId,
      action,
      context,
      currentUserId,
      userId: user.userId,
    });

    if (!proposalId || !action) {
      return NextResponse.json(
        { error: "Missing proposalId or action" },
        { status: 400 }
      );
    }

    // Get the original proposal
    const originalProposal = await prisma.bookingProposal.findUnique({
      where: { id: proposalId },
      include: {
        sender: true,
        receiver: true,
        listing: true,
        request: true,
      },
    });

    if (!originalProposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Verify user is the receiver
    if (originalProposal.receiverId !== user.userId) {
      return NextResponse.json(
        { error: "Not authorized to respond to this proposal" },
        { status: 403 }
      );
    }

    let result = {};

    switch (action) {
      case "accept":
        // Update original proposal
        await prisma.bookingProposal.update({
          where: { id: proposalId },
          data: { status: "ACCEPTED" },
        });

        let booking = null;

        if (originalProposal.bookingId) {
          // Flow A: Update existing booking
          booking = await prisma.booking.update({
            where: { id: originalProposal.bookingId },
            data: {
              status: "CONFIRMED",
              totalPrice: originalProposal.price,
              startDate: originalProposal.startDate,
              paymentDue:
                originalProposal.deadline ||
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        } else if (originalProposal.serviceRequestId) {
          // Flow B: Check if booking already exists for this service request
          const existingBooking = await prisma.booking.findUnique({
            where: { serviceRequestId: originalProposal.serviceRequestId },
          });

          if (existingBooking) {
            // Update existing booking (re-booking after cancellation/decline)
            booking = await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                status: "CONFIRMED",
                totalPrice: originalProposal.price,
                startDate: originalProposal.startDate
                  ? new Date(originalProposal.startDate)
                  : null,
                paymentDue: originalProposal.deadline
                  ? new Date(originalProposal.deadline)
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                latestProposalId: originalProposal.id,
              },
            });

            // Update the proposal with the existing booking
            await prisma.bookingProposal.update({
              where: { id: proposalId },
              data: { bookingId: booking.id },
            });
          } else {
            // Create new booking (first time accepting)
            booking = await prisma.booking.create({
              data: {
                clientId: originalProposal.receiverId,
                serviceRequestId: originalProposal.serviceRequestId,
                bookingDate: new Date(),
                totalPrice: originalProposal.price,
                paymentStatus: "PENDING",
                paymentDue: originalProposal.deadline
                  ? new Date(originalProposal.deadline)
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: "CONFIRMED",
                startDate: originalProposal.startDate
                  ? new Date(originalProposal.startDate)
                  : null,
                latestProposalId: originalProposal.id,
              },
            });

            // Update the proposal with the new booking
            await prisma.bookingProposal.update({
              where: { id: proposalId },
              data: { bookingId: booking.id },
            });
          }

          // Link conversation to booking (works for both new and existing)
          const conversation = await prisma.conversation.findFirst({
            where: { requestId: originalProposal.serviceRequestId },
          });

          if (conversation) {
            await prisma.conversation.update({
              where: { conversationId: conversation.conversationId },
              data: { bookingId: booking.id },
            });
          }

          // Update ServiceRequest to assign resolver
          await prisma.serviceRequest.update({
            where: { id: originalProposal.serviceRequestId },
            data: {
              resolverId: originalProposal.senderId,
              status: "ASSIGNED",
            },
          });

          // Decline all other pending proposals for this request
          await prisma.bookingProposal.updateMany({
            where: {
              serviceRequestId: originalProposal.serviceRequestId,
              id: { not: proposalId },
              status: "PENDING",
            },
            data: {
              status: "DECLINED",
              declineReason: "Request was assigned to another resolver",
            },
          });
        }

        result = { booking, status: "ACCEPTED" };
        break;

      case "decline":
        if (!declineReason) {
          return NextResponse.json(
            { error: "Decline reason is required" },
            { status: 400 }
          );
        }

        await prisma.bookingProposal.update({
          where: { id: proposalId },
          data: {
            status: "DECLINED",
            declineReason: declineReason,
          },
        });

        // Update booking status if exists (Flow A)
        if (originalProposal.bookingId) {
          await prisma.booking.update({
            where: { id: originalProposal.bookingId },
            data: { status: "DECLINED" },
          });
        }

        result = { status: "DECLINED" };
        break;

      case "counter":
      case "new":
        const parsedPrice = parseFloat(price);
        if (!description || isNaN(parsedPrice) || parsedPrice <= 0) {
          return NextResponse.json(
            { error: "Invalid counter proposal data" },
            { status: 400 }
          );
        }

        // Update original proposal status
        await prisma.bookingProposal.update({
          where: { id: proposalId },
          data: { status: action === "counter" ? "MODIFIED" : "DECLINED" },
        });

        // Create counter proposal (reverse sender/receiver)
        const counterProposal = await prisma.bookingProposal.create({
          data: {
            senderId: originalProposal.receiverId, // Now the responder becomes sender
            receiverId: originalProposal.senderId, // Original sender becomes receiver
            serviceListingId: originalProposal.serviceListingId,
            serviceRequestId: originalProposal.serviceRequestId,
            bookingId: originalProposal.bookingId, // null for Flow B until accepted
            description: description,
            price: parsedPrice,
            startDate: newStartDate
              ? new Date(newStartDate)
              : originalProposal.startDate,
            deadline: deadline ? new Date(deadline) : originalProposal.deadline,
            attachments: attachment || null,
            status: "PENDING",
          },
          include: {
            sender: true,
            receiver: true,
          },
        });

        // Update booking with new latest proposal (Flow A only)
        if (originalProposal.bookingId) {
          await prisma.booking.update({
            where: { id: originalProposal.bookingId },
            data: {
              latestProposalId: counterProposal.id,
              status: "NEGOTIATING",
            },
          });
        }

        result = {
          counterProposal,
          status: action === "counter" ? "COUNTER_SENT" : "NEW_PROPOSAL_SENT",
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    console.log("Respond API success:", { action, result });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error responding to proposal:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// Keep PATCH method for backwards compatibility
export async function PATCH(request) {
  return POST(request);
}
