import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { CheckSquare, LayoutDashboard, FolderKanban } from "@/components/Icons";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const initials = session.user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-7">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition">
                <CheckSquare width={18} height={18} className="text-white" />
              </span>
              <span className="font-semibold text-base tracking-tight">TaskManager</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/dashboard" icon={<LayoutDashboard width={16} height={16} />}>
                Dashboard
              </NavLink>
              <NavLink href="/projects" icon={<FolderKanban width={16} height={16} />}>
                Projects
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/10 text-xs font-medium">
                {initials}
              </span>
              <span className="text-zinc-300">{session.user.name}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      {children}
    </Link>
  );
}
