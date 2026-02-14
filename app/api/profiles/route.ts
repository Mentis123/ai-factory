import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(profiles);
  } catch (err) {
    console.error("GET /api/profiles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
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
  } catch (err) {
    console.error("POST /api/profiles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
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
  } catch (err) {
    console.error("PUT /api/profiles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.profile.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/profiles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete profile" },
      { status: 500 }
    );
  }
}
