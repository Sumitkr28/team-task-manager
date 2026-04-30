"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Signup failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 bg-zinc-50 dark:bg-black">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Name</label>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
          <p className="text-xs text-zinc-500">At least 8 characters and one digit.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 hover:bg-blue-700 text-white py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Creating..." : "Sign up"}
        </button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
