import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNewsletterHtml } from "@/lib/export/html";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try to get pre-generated newsletter first
  const newsletter = await prisma.newsletter.findFirst({
    where: { run_id: id },
    orderBy: { created_at: "desc" },
  });

  if (newsletter) {
    return new NextResponse(newsletter.html_content, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Generate on-the-fly if no stored newsletter
  const run = await prisma.run.findUnique({ where: { id } });
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const articles = await prisma.article.findMany({
    where: { run_id: id, is_kept: true, summary: { isNot: null } },
    include: { ranking: true, summary: true },
    orderBy: [{ sort_index: "asc" }, { created_at: "asc" }],
  });

  if (articles.length === 0) {
    return new NextResponse("<p>No articles with summaries found.</p>", {
      headers: { "Content-Type": "text/html" },
    });
  }

  const html = generateNewsletterHtml(
    `${run.prompt_topic} — Newsletter`,
    articles
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
