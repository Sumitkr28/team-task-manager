import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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

  const stats = [
    { label: "My projects", value: projectIds.length, tone: "blue" as const },
    { label: "Todo", value: todoCount, tone: "zinc" as const },
    { label: "In Progress", value: inProgressCount, tone: "amber" as const },
    { label: "Done", value: doneCount, tone: "emerald" as const },
    { label: "Due today", value: dueTodayCount, tone: "violet" as const },
    { label: "Overdue", value: overdueCount, tone: "red" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">Here&apos;s what&apos;s on your plate.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-3">Tasks assigned to me</h2>
          {assignedToMe.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks assigned. Enjoy the calm.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {assignedToMe.map((t) => {
                const overdue = t.dueDate && t.dueDate < now && t.status !== "DONE";
                return (
                  <li key={t.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/projects/${t.projectId}`} className="font-medium truncate hover:underline">
                        {t.title}
                      </Link>
                      <div className="text-xs text-zinc-500 truncate">
                        {t.project.name} · {t.status.replace("_", " ")}
                        {t.dueDate && (
                          <> · due {new Date(t.dueDate).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                    {overdue && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        overdue
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentActivity.map((a) => (
                <li key={a.id} className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">{a.actor.name}</span>{" "}
                  <span className="text-zinc-500">{a.type.replace(/_/g, " ").replace(".", " ")}</span>{" "}
                  in{" "}
                  <Link href={`/projects/${a.projectId}`} className="hover:underline">
                    {a.project.name}
                  </Link>
                  <div className="text-xs text-zinc-500">
                    {new Date(a.createdAt).toLocaleString()}
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

function StatCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "zinc" | "amber" | "emerald" | "red" | "violet" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  } as const;
  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
