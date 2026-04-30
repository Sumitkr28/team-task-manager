"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@/components/Icons";

export default function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Failed to create project");
      return;
    }
    const { project } = await res.json();
    setOpen(false);
    setName("");
    setDescription("");
    router.push(`/projects/${project.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition text-white px-3.5 py-2 text-sm font-medium shadow-lg shadow-indigo-500/20"
      >
        <Plus width={16} height={16} />
        New project
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Create a new project</h2>
              <p className="text-xs text-zinc-500 mt-1">You&apos;ll become the project admin.</p>
            </div>
            <Field label="Project name">
              <input
                autoFocus
                required
                placeholder="e.g. Q3 Marketing Site"
                aria-label="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="modal-input"
              />
            </Field>
            <Field label="Description" hint="Optional">
              <textarea
                placeholder="What is this project about?"
                aria-label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="modal-input h-24 resize-none"
              />
            </Field>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3.5 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {loading ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
          <style>{`
            .modal-input {
              width: 100%;
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 6px;
              padding: 0.5rem 0.75rem;
              color: #fafafa;
              font-size: 0.875rem;
              transition: border-color 0.15s, background 0.15s;
            }
            .modal-input:hover { background: rgba(255,255,255,0.05); }
            .modal-input:focus { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.5); outline: none; }
          `}</style>
        </div>
      )}
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
        {hint && <span className="ml-1.5 text-zinc-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
