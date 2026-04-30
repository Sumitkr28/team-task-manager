"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "@/components/Icons";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition"
    >
      <LogOut width={14} height={14} />
      <span className="hidden sm:inline">Log out</span>
    </button>
  );
}
