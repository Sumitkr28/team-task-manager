import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleError } from "@/lib/http";

export async function GET() {
  try {
    const { user } = await requireSession();
    const userId = user.id;

    const projectIds = (
      await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      })
    ).map((m) => m.projectId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      assignedToMe,
      todoCount,
      inProgressCount,
      doneCount,
      overdueCount,
      dueTodayCount,
      recentActivity,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId, projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 20,
      }),
      prisma.task.count({ where: { assigneeId: userId, status: "TODO" } }),
      prisma.task.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { assigneeId: userId, status: "DONE" } }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.activity.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          actor: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      assignedToMe,
      byStatus: { TODO: todoCount, IN_PROGRESS: inProgressCount, DONE: doneCount },
      overdue: overdueCount,
      dueToday: dueTodayCount,
      projectCount: projectIds.length,
      recentActivity,
    });
  } catch (err) {
    return handleError(err);
  }
}
