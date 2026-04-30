import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getMembership } from "@/lib/rbac";
import ProjectBoard from "@/components/ProjectBoard";
import MembersPanel from "@/components/MembersPanel";

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
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{project.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${membership.role === "ADMIN" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
          You: {membership.role}
        </span>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <ProjectBoard
          projectId={project.id}
          initialTasks={tasks}
          members={project.members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email }))}
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
