"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  user: { id: string; email: string; name: string };
  role: "ADMIN" | "MEMBER";
};

export default function MembersPanel({
  projectId,
  members,
  myRole,
  currentUserId,
}: {
  projectId: string;
  members: Member[];
  myRole: "ADMIN" | "MEMBER";
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Failed to invite");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function remove(userId: string) {
    if (!confirm("Remove this member?")) return;
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error?.message ?? "Failed to remove");
    }
  }

  async function changeRole(userId: string, newRole: "ADMIN" | "MEMBER") {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) router.refresh();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error?.message ?? "Failed to change role");
    }
  }

  return (
    <aside className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 h-fit">
      <h2 className="font-semibold">Members ({members.length})</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <div className="font-medium truncate">{m.user.name}{m.user.id === currentUserId && " (you)"}</div>
              <div className="text-xs text-zinc-500 truncate">{m.user.email}</div>
            </div>
            <div className="flex items-center gap-1">
              {myRole === "ADMIN" && m.user.id !== currentUserId ? (
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.user.id, e.target.value as "ADMIN" | "MEMBER")}
                  className="text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1 py-0.5"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              ) : (
                <span className={`text-xs px-1.5 py-0.5 rounded ${m.role === "ADMIN" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                  {m.role}
                </span>
              )}
              {myRole === "ADMIN" && m.user.id !== currentUserId && (
                <button onClick={() => remove(m.user.id)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {myRole === "ADMIN" && (
        <form onSubmit={invite} className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="font-medium text-sm">Invite a member</h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
            {loading ? "Inviting..." : "Invite"}
          </button>
          <p className="text-xs text-zinc-500">User must already have an account.</p>
        </form>
      )}
    </aside>
  );
}
