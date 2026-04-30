import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { memberInviteSchema } from "@/lib/validators";
import { requireProjectAdmin, requireProjectMember } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectMember(user.id, projectId);

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { role: "asc" },
    });
    return NextResponse.json({ members });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await ctx.params;
    const { user } = await requireSession();
    await requireProjectAdmin(user.id, projectId);

    const { email, role } = memberInviteSchema.parse(await req.json());

    const invitee = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!invitee) throw new HttpError(404, "No user with that email — they need to sign up first");

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: invitee.id, projectId } },
    });
    if (existing) throw new HttpError(409, "User is already a member of this project");

    const member = await prisma.projectMember.create({
      data: { userId: invitee.id, projectId, role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    await logActivity({
      projectId,
      actorId: user.id,
      type: "member.invited",
      meta: { invitedUserId: invitee.id, email: invitee.email, role },
    });

    return NextResponse.json({ member });
  } catch (err) {
    return handleError(err);
  }
}
