import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const body = await request.json();
  const {
    name,
    default_source_urls = [],
    default_keywords = [],
    trends_to_watch = [],
    competitors_to_monitor = [],
  } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      name,
      default_source_urls,
      default_keywords,
      trends_to_watch,
      competitors_to_monitor,
    },
  });

  return NextResponse.json(profile, { status: 201 });
}

export async function PUT(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { id },
    data,
  });

  return NextResponse.json(profile);
}

export async function DELETE(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
