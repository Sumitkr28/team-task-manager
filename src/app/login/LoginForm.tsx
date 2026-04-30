"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckSquare } from "@/components/Icons";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Login failed");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <CheckSquare width={26} height={26} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center tracking-tight">Welcome back</h1>
        <p className="text-zinc-500 text-sm text-center mt-1.5">Sign in to your team workspace</p>

        <form
          onSubmit={onSubmit}
          className="mt-7 rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-sm p-6 space-y-4"
        >
          <Field label="Email">
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition text-white py-2.5 font-medium disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-zinc-500 text-center mt-5">
          No account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition">
            Create one
          </Link>
        </p>
      </div>
      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          color: #fafafa;
          font-size: 0.875rem;
          transition: border-color 0.15s, background 0.15s;
        }
        .input:hover { background: rgba(255,255,255,0.05); }
        .input:focus { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.5); outline: none; }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
