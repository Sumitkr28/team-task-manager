import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { memberUpdateSchema } from "@/lib/validators";
import { requireProjectAdmin } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id: projectId, userId: targetUserId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectAdmin(user.id, projectId);

    const { role } = memberUpdateSchema.parse(await req.json());

    const targetMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    if (!targetMembership) throw new HttpError(404, "Member not found");

    if (targetMembership.role === "ADMIN" && role === "MEMBER") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount <= 1) throw new HttpError(409, "Cannot demote the last admin");
    }

    const updated = await prisma.projectMember.update({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    await logActivity({
      projectId,
      actorId: user.id,
      type: "member.role_changed",
      meta: { targetUserId, role },
    });

    return NextResponse.json({ member: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id: projectId, userId: targetUserId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectAdmin(user.id, projectId);

    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    if (!target) throw new HttpError(404, "Member not found");

    if (target.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount <= 1) throw new HttpError(409, "Cannot remove the last admin");
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });

    await logActivity({
      projectId,
      actorId: user.id,
      type: "member.removed",
      meta: { targetUserId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
