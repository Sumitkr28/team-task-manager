import { prisma } from "./db";
import { HttpError } from "./auth";

export type ProjectMembership = { role: "ADMIN" | "MEMBER" };

export async function getMembership(userId: string, projectId: string): Promise<ProjectMembership | null> {
  const m = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  return m;
}

export async function requireProjectMember(userId: string, projectId: string): Promise<ProjectMembership> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new HttpError(404, "Project not found");
  const membership = await getMembership(userId, projectId);
  if (!membership) throw new HttpError(403, "You are not a member of this project");
  return membership;
}

export async function requireProjectAdmin(userId: string, projectId: string): Promise<void> {
  const m = await requireProjectMember(userId, projectId);
  if (m.role !== "ADMIN") throw new HttpError(403, "Admin role required");
}

export async function canEditTask(
  userId: string,
  taskId: string,
): Promise<{ task: { id: string; projectId: string; assigneeId: string | null; creatorId: string }; role: "ADMIN" | "MEMBER" }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, assigneeId: true, creatorId: true },
  });
  if (!task) throw new HttpError(404, "Task not found");
  const membership = await requireProjectMember(userId, task.projectId);
  const isAdmin = membership.role === "ADMIN";
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeId === userId;
  if (!isAdmin && !isCreator && !isAssignee) {
    throw new HttpError(403, "You can only edit tasks you created or are assigned to");
  }
  return { task, role: membership.role };
}

export async function canDeleteTask(userId: string, taskId: string): Promise<{ projectId: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, creatorId: true },
  });
  if (!task) throw new HttpError(404, "Task not found");
  const membership = await requireProjectMember(userId, task.projectId);
  const isAdmin = membership.role === "ADMIN";
  const isCreator = task.creatorId === userId;
  if (!isAdmin && !isCreator) {
    throw new HttpError(403, "Only the task creator or a project admin can delete this task");
  }
  return { projectId: task.projectId };
}
