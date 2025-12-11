import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(req) {
  const { bookingId, status, paymentStatus } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        paymentStatus,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
