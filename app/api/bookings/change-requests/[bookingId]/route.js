import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { bookingId } = params;
    const requests = await prisma.bookingChangeRequest.findMany({
      where: { bookingId: parseInt(bookingId) },
      include: { requester: true },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch Booking Change Requests Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
