import Link from "next/link";
import { logout } from "@/lib/actions";

const childLinks = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/skills", label: "Skills", icon: "📈" },
  { href: "/drills", label: "Drills", icon: "⚽" },
  { href: "/badges", label: "Badges", icon: "🏅" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-zinc-950">⚽</span>
      Footy<span className="text-emerald-400">Quest</span>
    </Link>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button className="text-sm text-zinc-400 hover:text-zinc-100">Log out</button>
    </form>
  );
}

export function ChildNav({ name, avatar }: { name: string; avatar: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {childLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <span className="sm:hidden">{l.icon}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-sm text-zinc-300 sm:flex">
            <span>{avatar}</span> {name}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export function UserNav({ name, role }: { name: string; role: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-300">
            {name} <span className="text-zinc-500">· {role === "PARENT" ? "Parent" : "Coach"}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
