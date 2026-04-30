import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import NewProjectButton from "@/components/NewProjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { user } = await requireSession();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
    orderBy: { project: { createdAt: "desc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <NewProjectButton />
      </div>
      {memberships.length === 0 ? (
        <div className="text-sm text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m) => (
            <Link
              key={m.project.id}
              href={`/projects/${m.project.id}`}
              className="block bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-400 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold truncate">{m.project.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded ${m.role === "ADMIN" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                  {m.role}
                </span>
              </div>
              {m.project.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {m.project.description}
                </p>
              )}
              <div className="mt-3 text-xs text-zinc-500 flex gap-3">
                <span>{m.project._count.tasks} tasks</span>
                <span>{m.project._count.members} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
