import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-lg">
              TaskManager
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/projects" className="hover:underline">Projects</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
