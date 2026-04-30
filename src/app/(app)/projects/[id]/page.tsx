import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getMembership } from "@/lib/rbac";
import ProjectBoard from "@/components/ProjectBoard";
import MembersPanel from "@/components/MembersPanel";
import { FolderKanban } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireSession();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { role: "asc" },
      },
    },
  });
  if (!project) notFound();

  const membership = await getMembership(user.id, id);
  if (!membership) notFound();

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1"
        >
          ← All projects
        </Link>
      </div>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/10 shrink-0">
            <FolderKanban width={22} height={22} className="text-white/90" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl">{project.description}</p>
            )}
          </div>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded border shrink-0 ${
            membership.role === "ADMIN"
              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/20"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          You: {membership.role}
        </span>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <ProjectBoard
          projectId={project.id}
          initialTasks={tasks}
          members={project.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
          }))}
          currentUserId={user.id}
          myRole={membership.role}
        />
        <MembersPanel
          projectId={project.id}
          members={project.members.map((m) => ({
            id: m.id,
            user: m.user,
            role: m.role,
          }))}
          myRole={membership.role}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
