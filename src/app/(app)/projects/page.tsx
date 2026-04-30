import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import NewProjectButton from "@/components/NewProjectButton";
import { FolderKanban, Users, ListTodo } from "@/components/Icons";

export const dynamic = "force-dynamic";

const ACCENT_GRADIENTS = [
  "from-indigo-500/30 to-violet-500/30",
  "from-violet-500/30 to-fuchsia-500/30",
  "from-cyan-500/30 to-blue-500/30",
  "from-emerald-500/30 to-teal-500/30",
  "from-amber-500/30 to-orange-500/30",
  "from-rose-500/30 to-pink-500/30",
];

function pickAccent(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ACCENT_GRADIENTS[Math.abs(h) % ACCENT_GRADIENTS.length];
}

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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {memberships.length === 0
              ? "Create your first project to get going."
              : `${memberships.length} project${memberships.length === 1 ? "" : "s"} on your radar.`}
          </p>
        </div>
        <NewProjectButton />
      </div>
      {memberships.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 grid place-items-center mb-4">
            <FolderKanban width={28} height={28} className="text-indigo-300" />
          </div>
          <h2 className="font-medium text-zinc-200">No projects yet</h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-md">
            Projects are where your team plans work. Create one to add tasks, invite teammates,
            and track progress on a Kanban board.
          </p>
          <div className="mt-5">
            <NewProjectButton />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m) => {
            const accent = pickAccent(m.project.id);
            return (
              <Link
                key={m.project.id}
                href={`/projects/${m.project.id}`}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 hover:border-white/15 hover:bg-zinc-900/60 transition"
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-70`} />
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br ${accent}`}>
                    <FolderKanban width={18} height={18} className="text-white/90" />
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border ${
                      m.role === "ADMIN"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/20"
                        : "bg-white/5 text-zinc-400 border-white/10"
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
                <h2 className="font-semibold text-zinc-100 truncate group-hover:text-white transition">
                  {m.project.name}
                </h2>
                {m.project.description ? (
                  <p className="text-sm text-zinc-500 line-clamp-2 mt-1.5 min-h-[2.5rem]">
                    {m.project.description}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 italic mt-1.5 min-h-[2.5rem]">
                    No description
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500 flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <ListTodo width={13} height={13} />
                    {m.project._count.tasks} {m.project._count.tasks === 1 ? "task" : "tasks"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users width={13} height={13} />
                    {m.project._count.members} {m.project._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
