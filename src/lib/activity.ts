import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export type ActivityType =
  | "project.created"
  | "project.updated"
  | "member.invited"
  | "member.removed"
  | "member.role_changed"
  | "task.created"
  | "task.updated"
  | "task.status_changed"
  | "task.assigned"
  | "task.deleted"
  | "comment.added";

export async function logActivity(input: {
  projectId: string;
  actorId: string;
  type: ActivityType;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.activity.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorId,
      type: input.type,
      meta: input.meta ?? {},
    },
  });
}
