import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(req) {
  try {
    const { contractId, action, signatureData } = await req.json();

    if (!contractId || !["AGREED", "DECLINED"].includes(action)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: action,
        respondedAt: new Date(),
        signatureData: signatureData || null,
      },
    });

    return NextResponse.json({ contract: updated });
  } catch (err) {
    console.error("Contract update failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
