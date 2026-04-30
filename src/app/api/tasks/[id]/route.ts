import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { taskUpdateSchema } from "@/lib/validators";
import { canEditTask, canDeleteTask, requireProjectMember } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!task) throw new HttpError(404, "Task not found");
    await requireProjectMember(user.id, task.projectId);
    return NextResponse.json({ task });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();
    const { task: existing } = await canEditTask(user.id, id);
    const data = taskUpdateSchema.parse(await req.json());

    if (data.assigneeId) {
      const ok = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: data.assigneeId, projectId: existing.projectId } },
      });
      if (!ok) throw new HttpError(400, "Assignee must be a member of this project");
    }

    const before = await prisma.task.findUnique({
      where: { id },
      select: { status: true, assigneeId: true },
    });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate:
          data.dueDate === undefined
            ? undefined
            : data.dueDate === null
            ? null
            : new Date(data.dueDate),
        assigneeId: data.assigneeId,
        tags: data.tags,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.status && before && before.status !== data.status) {
      await logActivity({
        projectId: existing.projectId,
        actorId: user.id,
        type: "task.status_changed",
        meta: { taskId: id, from: before.status, to: data.status },
      });
    }
    if (
      data.assigneeId !== undefined &&
      before &&
      data.assigneeId !== before.assigneeId
    ) {
      await logActivity({
        projectId: existing.projectId,
        actorId: user.id,
        type: "task.assigned",
        meta: { taskId: id, assigneeId: data.assigneeId },
      });
    }

    return NextResponse.json({ task: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireSession();
    const { projectId } = await canDeleteTask(user.id, id);
    await prisma.task.delete({ where: { id } });
    await logActivity({ projectId, actorId: user.id, type: "task.deleted", meta: { taskId: id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
