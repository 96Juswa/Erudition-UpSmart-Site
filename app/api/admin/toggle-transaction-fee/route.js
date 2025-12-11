import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { id: 1 },
    });
    return new Response(
      JSON.stringify({ enabled: setting?.transactionFeeOn }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch setting" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { enabled } = await req.json();

    const updated = await prisma.platformSetting.update({
      where: { id: 1 },
      data: { transactionFeeOn: enabled },
    });

    return new Response(
      JSON.stringify({ success: true, enabled: updated.transactionFeeOn }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update setting" }), {
      status: 500,
    });
  }
}
