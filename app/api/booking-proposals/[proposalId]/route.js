import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req, { params }) {
  const { proposalId } = params;

  if (!proposalId) {
    return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });
  }

  try {
    const proposal = await prisma.bookingProposal.findUnique({
      where: { id: parseInt(proposalId) },
      include: {
        sender: true, // ✅ include sender
        receiver: true, // optional: include receiver
        booking: true, // optional: include booking info
        listing: true, // optional: include listing
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
