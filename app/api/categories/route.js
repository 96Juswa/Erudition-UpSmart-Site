import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma'; // adjust if needed

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, categoryName: true },
      orderBy: { categoryName: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error('[API][CATEGORIES][GET]', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
