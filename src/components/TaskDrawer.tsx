"use client";

import { useEffect, useState } from "react";

type Member = { id: string; name: string; email: string };
type Comment = { id: string; body: string; createdAt: string; author: Member };
type FullTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  tags: string[];
  assigneeId: string | null;
  creatorId: string;
  assignee: Member | null;
  creator: Member;
  comments: Comment[];
};

export default function TaskDrawer({
  taskId,
  members,
  currentUserId,
  myRole,
  onClose,
  onChanged,
}: {
  taskId: string;
  members: Member[];
  currentUserId: string;
  myRole: "ADMIN" | "MEMBER";
  onClose: () => void;
  onChanged: (updated: Partial<FullTask> & { id: string } | null, deleted?: boolean) => void;
}) {
  const [task, setTask] = useState<FullTask | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((j) => {
        if (active) setTask(j.task);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  const canEdit = task && (myRole === "ADMIN" || task.creatorId === currentUserId || task.assigneeId === currentUserId);
  const canDelete = task && (myRole === "ADMIN" || task.creatorId === currentUserId);

  async function patch(data: Partial<FullTask>) {
    if (!task) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Failed to update");
      return;
    }
    const { task: updated } = await res.json();
    setTask((t) => (t ? { ...t, ...updated } : t));
    onChanged({ id: task.id, ...updated });
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment }),
    });
    if (res.ok) {
      const { comment } = await res.json();
      setTask((t) => (t ? { ...t, comments: [...t.comments, comment] } : t));
      setNewComment("");
    }
  }

  async function deleteTask() {
    if (!task) return;
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      onChanged(null, true);
      onClose();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error?.message ?? "Failed to delete");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-white dark:bg-zinc-950 overflow-y-auto"
      >
        {!task ? (
          <div className="p-6 text-sm text-zinc-500">Loading...</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Created by {task.creator.name}</span>
              <div className="flex gap-2">
                {canDelete && (
                  <button onClick={deleteTask} className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    Delete
                  </button>
                )}
                <button onClick={onClose} className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">
                  Close
                </button>
              </div>
            </div>

            <input
              defaultValue={task.title}
              disabled={!canEdit}
              onBlur={(e) => {
                if (e.target.value !== task.title && e.target.value.trim()) patch({ title: e.target.value });
              }}
              className="w-full text-xl font-semibold bg-transparent border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 py-1 outline-none"
            />

            <textarea
              defaultValue={task.description ?? ""}
              disabled={!canEdit}
              placeholder="Add a description..."
              onBlur={(e) => {
                if ((e.target.value || null) !== task.description) patch({ description: e.target.value });
              }}
              className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded p-2 min-h-24 outline-none focus:border-blue-400"
            />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <select
                  value={task.status}
                  disabled={!canEdit}
                  onChange={(e) => patch({ status: e.target.value as FullTask["status"] })}
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={task.priority}
                  disabled={!canEdit}
                  onChange={(e) => patch({ priority: e.target.value as FullTask["priority"] })}
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
              <Field label="Assignee">
                <select
                  value={task.assigneeId ?? ""}
                  disabled={!canEdit}
                  onChange={(e) => patch({ assigneeId: e.target.value || null })}
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                  disabled={!canEdit}
                  onChange={(e) => patch({ dueDate: e.target.value || null })}
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  defaultValue={task.tags.join(", ")}
                  disabled={!canEdit}
                  onBlur={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 10);
                    patch({ tags });
                  }}
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1"
                />
              </Field>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saving && <p className="text-xs text-zinc-500">Saving...</p>}

            <section>
              <h3 className="font-medium text-sm mb-2">Comments ({task.comments.length})</h3>
              <ul className="space-y-2">
                {task.comments.map((c) => (
                  <li key={c.id} className="bg-zinc-100 dark:bg-zinc-900 rounded p-2 text-sm">
                    <div className="text-xs text-zinc-500 mb-0.5">
                      {c.author.name} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{c.body}</div>
                  </li>
                ))}
              </ul>
              <form onSubmit={addComment} className="mt-2 flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
                />
                <button type="submit" className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Post
                </button>
              </form>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-zinc-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
