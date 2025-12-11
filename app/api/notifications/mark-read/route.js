import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { type, id } = await req.json();

  if (!type || !id) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    switch (type) {
      case "message":
        await prisma.message.update({
          where: { id: Number(id) },
          data: { readStatus: true },
        });
        break;

      case "proposal":
        // Don't auto-accept, just mark as viewed if needed
        // You might want to add a 'viewed' field to proposals
        break;

      case "contract":
        await prisma.contract.update({
          where: { id: Number(id) },
          data: { status: "READ" },
        });
        break;

      case "changeRequest":
        // Similar to proposals, just acknowledge viewing
        break;

      case "progressUpdate":
      case "bookingUpdate":
        // These are already logged, no action needed
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    return NextResponse.json(
      { error: "Failed to mark notification" },
      { status: 500 }
    );
  }
}
