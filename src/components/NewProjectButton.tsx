"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        onClick={() => setOpen(true)}
        className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium"
      >
        + New project
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg p-5 space-y-4"
          >
            <h2 className="text-lg font-semibold">Create project</h2>
            <input
              autoFocus
              required
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 h-24"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
