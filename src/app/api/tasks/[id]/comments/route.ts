import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { commentCreateSchema } from "@/lib/validators";
import { requireProjectMember } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await ctx.params;
    const { user } = await requireSession();
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!task) throw new HttpError(404, "Task not found");
    await requireProjectMember(user.id, task.projectId);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ comments });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await ctx.params;
    const { user } = await requireSession();
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!task) throw new HttpError(404, "Task not found");
    await requireProjectMember(user.id, task.projectId);

    const { body } = commentCreateSchema.parse(await req.json());

    const comment = await prisma.comment.create({
      data: { taskId, authorId: user.id, body },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    await logActivity({
      projectId: task.projectId,
      actorId: user.id,
      type: "comment.added",
      meta: { taskId, commentId: comment.id },
    });

    return NextResponse.json({ comment });
  } catch (err) {
    return handleError(err);
  }
}
