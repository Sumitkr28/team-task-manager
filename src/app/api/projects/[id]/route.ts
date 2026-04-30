import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { projectUpdateSchema } from "@/lib/validators";
import { requireProjectAdmin, requireProjectMember } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();
    const membership = await requireProjectMember(user.id, id);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });
    return NextResponse.json({ project, myRole: membership.role });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectAdmin(user.id, id);

    const data = projectUpdateSchema.parse(await req.json());
    const project = await prisma.project.update({ where: { id }, data });
    await logActivity({ projectId: id, actorId: user.id, type: "project.updated", meta: data });
    return NextResponse.json({ project });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectAdmin(user.id, id);

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
