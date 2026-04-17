import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    const serialized = messages.map((message) => ({
      ...message,
      createdAt: message.createdAt?.toISOString?.() ?? null,
    }));

    return Response.json(serialized);
  } catch (error) {
    console.error("GET /api/messages failed:", error);
    return new Response("Failed to fetch messages", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.content || typeof body.content !== "string") {
      return new Response("Content is required", { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: body.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return Response.json({
      ...message,
      createdAt: message.createdAt?.toISOString?.() ?? null,
    });
  } catch (error) {
    console.error("POST /api/messages failed:", error);
    return new Response("Failed to create message", { status: 500 });
  }
}