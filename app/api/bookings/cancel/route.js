import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { recalculateTrustRating } from "@/app/lib/trustRating";
import { updateCounters } from "@/app/lib/updateCounters";

export async function PATCH(req) {
  try {
    const { bookingId, requesterId } = await req.json();

    if (!bookingId || !requesterId) {
      return NextResponse.json(
        { error: "Missing bookingId or requesterId" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        serviceListing: {
          select: { resolverId: true },
        },
        serviceRequest: {
          select: { resolverId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursDiff = (startDate - now) / (1000 * 60 * 60);

    // Determine resolver
    let resolverId = null;
    if (booking.serviceListing?.resolverId) {
      resolverId = booking.serviceListing.resolverId;
    } else if (booking.serviceRequest?.resolverId) {
      resolverId = booking.serviceRequest.resolverId;
    }

    if (!resolverId) {
      console.warn("⚠️ Could not determine resolver for booking", bookingId);
    }

    if (hoursDiff >= 24) {
      // Auto-cancel
      const updated = await prisma.booking.update({
        where: { id: parseInt(bookingId) },
        data: { status: "CANCELED" },
      });

      await prisma.bookingChangeRequest.create({
        data: {
          bookingId: updated.id,
          requesterId,
          type: "CANCELLATION",
          reason: "Auto-cancel (24+ hours before start date)",
        },
      });

      // -------------------- INCREMENT CANCEL COUNTS --------------------
      const isClient = requesterId === booking.clientId;
      const isResolver = requesterId === resolverId;

      if (isClient) {
        await updateCounters("BOOKING_CANCELED", {
          clientId: requesterId,
        });
      } else if (isResolver) {
        await updateCounters("BOOKING_CANCELED", {
          resolverId: requesterId,
        });
      }
      // ---------------------------------------------

      // ✅ Trigger trust rating recalculation after cancellation
      try {
        await recalculateTrustRating(booking.clientId, "client");
        if (resolverId) {
          await recalculateTrustRating(resolverId, "resolver");
        }
        console.log(
          `✅ Trust ratings recalculated after booking ${bookingId} cancellation`
        );
      } catch (ratingError) {
        console.error(
          "⚠️ Error recalculating trust rating after cancellation:",
          ratingError
        );
      }

      return NextResponse.json({ success: true, booking: updated });
    } else {
      // Create cancellation request for approval
      const request = await prisma.bookingChangeRequest.create({
        data: {
          bookingId: booking.id,
          requesterId,
          type: "CANCELLATION",
          reason: "User requested cancellation",
        },
      });
      return NextResponse.json({ success: true, request });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to process cancellation" },
      { status: 500 }
    );
  }
}
