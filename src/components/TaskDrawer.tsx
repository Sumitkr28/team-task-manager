"use client";

import { useEffect, useState } from "react";
import { Trash, MessageSquare } from "@/components/Icons";

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
  onChanged: (updated: (Partial<FullTask> & { id: string }) | null, deleted?: boolean) => void;
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

  const canEdit =
    task && (myRole === "ADMIN" || task.creatorId === currentUserId || task.assigneeId === currentUserId);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-zinc-950 border-l border-white/10 overflow-y-auto"
      >
        {!task ? (
          <div className="p-6 text-sm text-zinc-500">Loading...</div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="grid place-items-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 text-[9px] font-medium text-white border border-white/10">
                  {task.creator.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                Created by <span className="text-zinc-300">{task.creator.name}</span>
              </div>
              <div className="flex gap-1.5">
                {canDelete && (
                  <button
                    type="button"
                    onClick={deleteTask}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                  >
                    <Trash width={12} height={12} />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                >
                  Close
                </button>
              </div>
            </div>

            <input
              defaultValue={task.title}
              disabled={!canEdit}
              aria-label="Task title"
              onBlur={(e) => {
                if (e.target.value !== task.title && e.target.value.trim()) patch({ title: e.target.value });
              }}
              className="w-full text-2xl font-semibold tracking-tight bg-transparent border-b border-transparent focus:border-white/10 py-1 outline-none disabled:opacity-70"
            />

            <textarea
              defaultValue={task.description ?? ""}
              disabled={!canEdit}
              placeholder="Add a description..."
              aria-label="Description"
              onBlur={(e) => {
                if ((e.target.value || null) !== task.description) patch({ description: e.target.value });
              }}
              className="w-full text-sm bg-white/[0.03] border border-white/10 rounded-md p-3 min-h-24 outline-none focus:border-indigo-400/50 placeholder:text-zinc-600 resize-y"
            />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status">
                <select
                  value={task.status}
                  disabled={!canEdit}
                  aria-label="Status"
                  onChange={(e) => patch({ status: e.target.value as FullTask["status"] })}
                  className="select"
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
                  aria-label="Priority"
                  onChange={(e) => patch({ priority: e.target.value as FullTask["priority"] })}
                  className="select"
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
                  aria-label="Assignee"
                  onChange={(e) => patch({ assigneeId: e.target.value || null })}
                  className="select"
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
                  aria-label="Due date"
                  onChange={(e) => patch({ dueDate: e.target.value || null })}
                  className="select"
                />
              </Field>
            </div>
            <Field label="Tags" hint="comma-separated">
              <input
                defaultValue={task.tags.join(", ")}
                disabled={!canEdit}
                placeholder="frontend, urgent, api"
                aria-label="Tags"
                onBlur={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 10);
                  patch({ tags });
                }}
                className="select"
              />
            </Field>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {saving && <p className="text-xs text-zinc-500">Saving…</p>}

            <section className="pt-2">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MessageSquare width={14} height={14} className="text-violet-400" />
                Comments
                <span className="text-xs text-zinc-500 font-normal">({task.comments.length})</span>
              </h3>
              <ul className="space-y-2.5">
                {task.comments.map((c) => (
                  <li key={c.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 text-[9px] font-medium text-white border border-white/10">
                        {c.author.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-zinc-300 font-medium">{c.author.name}</span>
                      <span>· {new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
                {task.comments.length === 0 && (
                  <li className="text-xs text-zinc-600 text-center py-4">No comments yet.</li>
                )}
              </ul>
              <form onSubmit={addComment} className="mt-3 flex gap-2">
                <input
                  value={newComment}
                  aria-label="Write a comment"
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 select"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3.5 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </section>
          </div>
        )}
      </aside>
      <style>{`
        .select {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 6px;
          padding: 0.5rem 0.625rem;
          color: #fafafa;
          font-size: 0.875rem;
          transition: border-color 0.15s, background 0.15s;
        }
        .select:hover:not(:disabled) { background: rgba(255,255,255,0.05); }
        .select:focus { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.5); outline: none; }
        .select:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
        {hint && <span className="ml-1.5 text-zinc-600 font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
