import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  FolderKanban,
  ListTodo,
  Loader,
  CheckCircle,
  CalendarDays,
  ClockAlert,
  Inbox,
  Activity,
  Sparkles,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.task.count({ where: { assigneeId: userId, status: "TODO" } }),
    prisma.task.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { assigneeId: userId, status: "DONE" } }),
    prisma.task.count({
      where: { assigneeId: userId, status: { not: "DONE" }, dueDate: { lt: now } },
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

  const greeting = (() => {
    const h = now.getHours();
    if (h < 5) return "Up late";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    { label: "My projects", value: projectIds.length, icon: <FolderKanban />, gradient: "from-indigo-500/20 to-indigo-500/5", iconBg: "bg-indigo-500/15 text-indigo-300" },
    { label: "Todo", value: todoCount, icon: <ListTodo />, gradient: "from-zinc-500/15 to-zinc-500/5", iconBg: "bg-zinc-500/15 text-zinc-300" },
    { label: "In Progress", value: inProgressCount, icon: <Loader />, gradient: "from-amber-500/20 to-amber-500/5", iconBg: "bg-amber-500/15 text-amber-300" },
    { label: "Done", value: doneCount, icon: <CheckCircle />, gradient: "from-emerald-500/20 to-emerald-500/5", iconBg: "bg-emerald-500/15 text-emerald-300" },
    { label: "Due today", value: dueTodayCount, icon: <CalendarDays />, gradient: "from-violet-500/20 to-violet-500/5", iconBg: "bg-violet-500/15 text-violet-300" },
    { label: "Overdue", value: overdueCount, icon: <ClockAlert />, gradient: "from-red-500/20 to-red-500/5", iconBg: "bg-red-500/15 text-red-300" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-zinc-400 flex items-center gap-1.5">
          <Sparkles width={14} height={14} className="text-indigo-400" />
          {greeting}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
          Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user.name}</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1.5">Here&apos;s what&apos;s on your plate today.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${s.gradient} p-4 transition hover:border-white/10`}
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.iconBg} mb-2`}>
              {s.icon}
            </div>
            <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Inbox width={16} height={16} className="text-indigo-400" />
              Tasks assigned to me
            </h2>
            {assignedToMe.length > 0 && (
              <span className="text-xs text-zinc-500">{assignedToMe.length}</span>
            )}
          </div>
          {assignedToMe.length === 0 ? (
            <EmptyState
              icon={<Inbox width={28} height={28} className="text-zinc-600" />}
              title="No tasks assigned"
              hint="Enjoy the calm — or pick up something from a project board."
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {assignedToMe.map((t) => {
                const overdue = t.dueDate && t.dueDate < now && t.status !== "DONE";
                return (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${t.projectId}`}
                        className="font-medium text-zinc-100 truncate hover:text-indigo-400 transition block"
                      >
                        {t.title}
                      </Link>
                      <div className="text-xs text-zinc-500 truncate mt-0.5 flex items-center gap-2">
                        <StatusPill status={t.status} />
                        <span>{t.project.name}</span>
                        {t.dueDate && (
                          <span className={overdue ? "text-red-400" : ""}>
                            · due {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {overdue && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                        overdue
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Activity width={16} height={16} className="text-violet-400" />
            Recent activity
          </h2>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity width={28} height={28} className="text-zinc-600" />}
              title="No activity yet"
              hint="Create a project to start collaborating."
            />
          ) : (
            <ul className="space-y-3 text-sm">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-200 leading-snug">
                      <span className="font-medium">{a.actor.name}</span>{" "}
                      <span className="text-zinc-500">{prettyActivity(a.type)}</span>{" "}
                      <Link href={`/projects/${a.projectId}`} className="text-indigo-400 hover:underline">
                        {a.project.name}
                      </Link>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {timeAgo(new Date(a.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-14 h-14 rounded-full bg-white/5 grid place-items-center mb-3">{icon}</div>
      <p className="font-medium text-zinc-300">{title}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-[28ch]">{hint}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "TODO" | "IN_PROGRESS" | "DONE" }) {
  const map = {
    TODO: { label: "Todo", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" },
    IN_PROGRESS: { label: "In Progress", cls: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
    DONE: { label: "Done", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  } as const;
  const m = map[status];
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function prettyActivity(type: string): string {
  const map: Record<string, string> = {
    "project.created": "created project",
    "project.updated": "updated project",
    "member.invited": "invited a member to",
    "member.removed": "removed a member from",
    "member.role_changed": "changed a role in",
    "task.created": "created a task in",
    "task.updated": "updated a task in",
    "task.status_changed": "changed task status in",
    "task.assigned": "assigned a task in",
    "task.deleted": "deleted a task in",
    "comment.added": "commented in",
  };
  return map[type] ?? type;
}

function timeAgo(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
