import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { taskCreateSchema } from "@/lib/validators";
import { requireProjectMember } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import type { Prisma, TaskStatus } from "@/generated/prisma/client";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectMember(user.id, projectId);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const assigneeId = url.searchParams.get("assigneeId");
    const overdue = url.searchParams.get("overdue") === "true";
    const tag = url.searchParams.get("tag");

    const where: Prisma.TaskWhereInput = { projectId };
    if (status) where.status = status as TaskStatus;
    if (assigneeId) where.assigneeId = assigneeId === "me" ? user.id : assigneeId;
    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: "DONE" };
    }
    if (tag) where.tags = { has: tag };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectMember(user.id, projectId);

    const data = taskCreateSchema.parse(await req.json());

    if (data.assigneeId) {
      const ok = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: data.assigneeId, projectId } },
      });
      if (!ok) throw new HttpError(400, "Assignee must be a member of this project");
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        status: data.status ?? "TODO",
        priority: data.priority ?? "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId ?? null,
        creatorId: user.id,
        tags: data.tags ?? [],
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      projectId,
      actorId: user.id,
      type: "task.created",
      meta: { taskId: task.id, title: task.title },
    });
    if (data.assigneeId) {
      await logActivity({
        projectId,
        actorId: user.id,
        type: "task.assigned",
        meta: { taskId: task.id, assigneeId: data.assigneeId },
      });
    }

    return NextResponse.json({ task });
  } catch (err) {
    return handleError(err);
  }
}
