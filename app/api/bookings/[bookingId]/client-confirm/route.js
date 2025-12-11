import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(req, contextPromise) {
  const { params } = await contextPromise;

  try {
    const bookingId = Number(params.bookingId);
    const body = await req.json();
    const { clientId, accepted } = body;

    if (!bookingId || !clientId || typeof accepted !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid input" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: { select: { resolverId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== clientId) {
      return NextResponse.json(
        { error: "Unauthorized: not the client of this booking" },
        { status: 403 }
      );
    }

    // Booking must be marked as completed by resolver first
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Booking is not in completed state" },
        { status: 400 }
      );
    }

    let updateData = { clientAcknowledged: accepted };
    let message = "";

    if (accepted) {
      // ✅ Check if both provider and client have acknowledged all payments
      const payments = await prisma.paymentLog.findMany({
        where: { bookingId },
        select: {
          id: true,
          providerAcknowledged: true,
          clientAcknowledged: true,
        },
      });

      const allPaymentsAcknowledged =
        payments.length > 0 &&
        payments.every((p) => p.providerAcknowledged && p.clientAcknowledged);

      if (!allPaymentsAcknowledged) {
        return NextResponse.json(
          {
            error: "Payments not fully acknowledged",
            message:
              "Both the provider and client must acknowledge all payments before moving to the review stage.",
          },
          { status: 409 }
        );
      }

      // ✅ Payments acknowledged, proceed to awaiting review
      updateData.status = "AWAITING_REVIEW";
      message = "Work confirmed as completed. Review period has started.";

      await prisma.progressUpdate.create({
        data: {
          bookingId,
          updaterId: clientId,
          status: "AWAITING_REVIEW",
          message: "Client confirmed work completion. Review period started.",
        },
      });

      console.log(
        `📧 Notify both parties: booking ${bookingId} entered review period`
      );
    } else {
      // ❌ Client rejected - revert to in-progress
      updateData.status = "IN_PROGRESS";
      message = "Revision requested. Work has been sent back to resolver.";

      await prisma.progressUpdate.create({
        data: {
          bookingId,
          updaterId: clientId,
          status: "IN_PROGRESS",
          message:
            "Client requested revision. Please review and update the work.",
        },
      });

      const resolverId = booking.serviceListing?.resolverId;
      console.log(
        `📧 Notify resolver ${resolverId} that client requested revision for booking ${bookingId}`
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return NextResponse.json(
      {
        message,
        booking: updatedBooking,
        action: accepted ? "confirmed" : "revision_requested",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in PATCH /client-confirm:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
