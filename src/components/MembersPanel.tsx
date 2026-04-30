"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus } from "@/components/Icons";

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
    <aside className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 space-y-4 h-fit lg:sticky lg:top-20">
      <h2 className="font-semibold flex items-center gap-2">
        <Users width={16} height={16} className="text-indigo-400" />
        Members
        <span className="text-xs text-zinc-500 font-normal">({members.length})</span>
      </h2>
      <ul className="space-y-2.5">
        {members.map((m) => {
          const initials = m.user.name
            .split(" ")
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/10 text-[11px] font-medium text-white shrink-0">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-zinc-100 truncate">
                    {m.user.name}
                    {m.user.id === currentUserId && (
                      <span className="text-zinc-500 font-normal"> · you</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{m.user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {myRole === "ADMIN" && m.user.id !== currentUserId ? (
                  <select
                    value={m.role}
                    aria-label="Role"
                    onChange={(e) => changeRole(m.user.id, e.target.value as "ADMIN" | "MEMBER")}
                    className="text-xs rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 px-1.5 py-1 outline-none transition"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <span
                    className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${
                      m.role === "ADMIN"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/20"
                        : "bg-white/5 text-zinc-400 border-white/10"
                    }`}
                  >
                    {m.role}
                  </span>
                )}
                {myRole === "ADMIN" && m.user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => remove(m.user.id)}
                    className="text-xs text-zinc-500 hover:text-red-400 px-1.5 py-1 rounded transition"
                    aria-label="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {myRole === "ADMIN" && (
        <form onSubmit={invite} className="space-y-2 pt-3 border-t border-white/5">
          <h3 className="font-medium text-sm flex items-center gap-1.5">
            <Plus width={13} height={13} className="text-indigo-400" />
            Invite a member
          </h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            aria-label="Member email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="member-input"
          />
          <select
            value={role}
            aria-label="Role"
            onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
            className="member-input"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? "Inviting..." : "Invite"}
          </button>
          <p className="text-xs text-zinc-500">User must already have an account.</p>
        </form>
      )}
      <style>{`
        .member-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 0.4rem 0.625rem;
          color: #fafafa;
          font-size: 0.875rem;
          transition: border-color 0.15s, background 0.15s;
        }
        .member-input:hover { background: rgba(255,255,255,0.05); }
        .member-input:focus { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.5); outline: none; }
      `}</style>
    </aside>
  );
}
