"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaskDrawer from "./TaskDrawer";
import { Plus, MessageSquare, ListTodo, Loader, CheckCircle } from "@/components/Icons";

type Member = { id: string; name: string; email: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | string | null;
  tags: string[];
  assigneeId: string | null;
  creatorId: string;
  assignee: Member | null;
  creator: Member;
  _count: { comments: number };
};

const COLUMNS: { key: Task["status"]; label: string; icon: React.ReactNode; accent: string }[] = [
  { key: "TODO", label: "Todo", icon: <ListTodo width={14} height={14} />, accent: "text-zinc-400" },
  { key: "IN_PROGRESS", label: "In Progress", icon: <Loader width={14} height={14} />, accent: "text-amber-400" },
  { key: "DONE", label: "Done", icon: <CheckCircle width={14} height={14} />, accent: "text-emerald-400" },
];

export default function ProjectBoard({
  projectId,
  initialTasks,
  members,
  currentUserId,
  myRole,
}: {
  projectId: string;
  initialTasks: Task[];
  members: Member[];
  currentUserId: string;
  myRole: "ADMIN" | "MEMBER";
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<Task["status"] | null>(null);
  const [dragOver, setDragOver] = useState<Task["status"] | null>(null);

  function refresh() {
    router.refresh();
  }

  async function quickCreate(status: Task["status"], title: string) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks((t) => [task, ...t]);
    }
  }

  async function moveTask(taskId: string, status: Task["status"]) {
    const t = tasks.find((x) => x.id === taskId);
    if (!t || t.status === status) return;
    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status } : x)));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status: t.status } : x)));
      const j = await res.json().catch(() => ({}));
      alert(j?.error?.message ?? "Failed to update status");
    }
    refresh();
  }

  function canModify(task: Task) {
    return myRole === "ADMIN" || task.creatorId === currentUserId || task.assigneeId === currentUserId;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          const isDragOver = dragOver === col.key;
          return (
            <div
              key={col.key}
              className={`rounded-xl border ${
                isDragOver ? "border-indigo-400/50 bg-indigo-500/5" : "border-white/5 bg-zinc-900/30"
              } backdrop-blur-sm p-3 min-h-[260px] transition`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTask(id, col.key);
              }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className={`font-semibold text-sm flex items-center gap-1.5 ${col.accent}`}>
                  {col.icon}
                  {col.label}
                </h3>
                <span className="text-xs text-zinc-500 bg-white/5 rounded px-1.5 py-0.5">
                  {colTasks.length}
                </span>
              </div>
              <ul className="space-y-2">
                {colTasks.map((t) => {
                  const due = t.dueDate ? new Date(t.dueDate) : null;
                  const overdue = due && due < new Date() && t.status !== "DONE";
                  return (
                    <li
                      key={t.id}
                      draggable={canModify(t)}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      onClick={() => setOpenTaskId(t.id)}
                      className="group bg-zinc-800/60 hover:bg-zinc-800 rounded-lg p-3 border border-white/5 hover:border-white/10 cursor-pointer transition"
                    >
                      <div className="text-sm font-medium text-zinc-100 leading-snug">{t.title}</div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className={priorityClass(t.priority)}>{t.priority}</span>
                        {t.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5"
                          >
                            #{tag}
                          </span>
                        ))}
                        {t.tags.length > 3 && (
                          <span className="text-zinc-500">+{t.tags.length - 3}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {t.assignee ? (
                            <>
                              <span className="grid place-items-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 text-[9px] font-medium text-white border border-white/10">
                                {t.assignee.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                              <span className="truncate">{t.assignee.name}</span>
                            </>
                          ) : (
                            <span className="italic text-zinc-600">Unassigned</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {due && (
                            <span className={overdue ? "text-red-400" : ""}>
                              {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {t._count.comments > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <MessageSquare width={11} height={11} />
                              {t._count.comments}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {colTasks.length === 0 && creatingFor !== col.key && (
                  <li className="text-xs text-zinc-600 text-center py-6">No tasks</li>
                )}
              </ul>
              {creatingFor === col.key ? (
                <QuickAddForm
                  onSubmit={async (title) => {
                    await quickCreate(col.key, title);
                    setCreatingFor(null);
                  }}
                  onCancel={() => setCreatingFor(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingFor(col.key)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 py-2 rounded-md border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition"
                >
                  <Plus width={12} height={12} />
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {openTaskId && (
        <TaskDrawer
          taskId={openTaskId}
          members={members}
          currentUserId={currentUserId}
          myRole={myRole}
          onClose={() => setOpenTaskId(null)}
          onChanged={(updated, deleted) => {
            if (deleted) {
              setTasks((prev) => prev.filter((t) => t.id !== openTaskId));
            } else if (updated) {
              setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            }
            refresh();
          }}
        />
      )}
    </>
  );
}

function priorityClass(p: Task["priority"]) {
  if (p === "HIGH")
    return "px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/20 font-medium uppercase";
  if (p === "MEDIUM")
    return "px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20 font-medium uppercase";
  return "px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-300 border border-white/5 font-medium uppercase";
}

function QuickAddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) onSubmit(title.trim());
      }}
      className="mt-2 space-y-2 bg-white/5 border border-white/10 rounded-lg p-2"
    >
      <input
        autoFocus
        value={title}
        aria-label="Task title"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task title"
        className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-400/50"
      />
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex-1 px-2.5 py-1 text-xs rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium transition"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
