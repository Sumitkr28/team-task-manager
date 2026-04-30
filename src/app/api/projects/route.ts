import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { projectCreateSchema } from "@/lib/validators";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const { user } = await requireSession();
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            ownerId: true,
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
      orderBy: { project: { createdAt: "desc" } },
    });
    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));
    return NextResponse.json({ projects });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireSession();
    const body = await request.json();
    const data = projectCreateSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "ADMIN" },
        },
      },
    });

    await logActivity({
      projectId: project.id,
      actorId: user.id,
      type: "project.created",
      meta: { name: project.name },
    });

    return NextResponse.json({ project });
  } catch (err) {
    return handleError(err);
  }
}
