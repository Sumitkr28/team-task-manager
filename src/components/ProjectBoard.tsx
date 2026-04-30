"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaskDrawer from "./TaskDrawer";

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

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
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
    if (!t) return;
    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status } : x)));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      // revert
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
          return (
            <div
              key={col.key}
              className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 min-h-[200px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTask(id, col.key);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{col.label}</h3>
                <span className="text-xs text-zinc-500">{colTasks.length}</span>
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
                      className={`bg-white dark:bg-zinc-800 rounded p-2.5 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-blue-400 ${canModify(t) ? "" : "opacity-90"}`}
                    >
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs">
                        <span className={priorityClass(t.priority)}>{t.priority}</span>
                        {t.tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            #{tag}
                          </span>
                        ))}
                        {due && (
                          <span className={overdue ? "text-red-600" : "text-zinc-500"}>
                            {due.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
                        <span>{t.assignee?.name ?? "Unassigned"}</span>
                        {t._count.comments > 0 && <span>💬 {t._count.comments}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => setCreatingFor(col.key)}
                className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1 rounded border border-dashed border-zinc-300 dark:border-zinc-700"
              >
                + Add task
              </button>
              {creatingFor === col.key && (
                <QuickAddForm
                  onSubmit={async (title) => {
                    await quickCreate(col.key, title);
                    setCreatingFor(null);
                  }}
                  onCancel={() => setCreatingFor(null)}
                />
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
  if (p === "HIGH") return "px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (p === "MEDIUM") return "px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300";
}

function QuickAddForm({ onSubmit, onCancel }: { onSubmit: (title: string) => void | Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) onSubmit(title.trim());
      }}
      className="mt-2 space-y-1"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task title"
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-sm"
      />
      <div className="flex gap-1">
        <button type="submit" className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">Add</button>
        <button type="button" onClick={onCancel} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700">Cancel</button>
      </div>
    </form>
  );
}
