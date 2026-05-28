"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BookOpen, LayoutDashboard, MapPinned, Moon, Sun, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredAuth, clearAuth } from "@/lib/api";
import { useRouter } from "next/navigation";

const links = [
  { href: "/#facilities", label: "Facilities" },
  { href: "/#memberships", label: "Plans" },
  { href: "/booking", label: "Book Seat" },
  { href: "/register", label: "Register" },
  { href: "/signin", label: "Sign In" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = getStoredAuth();
    if (stored) setUser({ name: stored.user.name, role: stored.user.role });
  }, []);

  const isDark = resolvedTheme === "dark";

  function handleSignOut() {
    clearAuth();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="glass mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg px-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white shadow-warm dark:bg-white dark:text-ink">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="hidden text-base sm:inline">LN StudyHall</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {mounted ? (
              isDark ? <Moon className="h-5 w-5 text-neon" /> : <Sun className="h-5 w-5 text-brass" />
            ) : <span className="h-5 w-5" aria-hidden />}
          </Button>
          {user ? (
            <>
              <span className="flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/10">
                <User className="h-3.5 w-3.5 text-lagoon" />
                {user.name.split(" ")[0]}
              </span>
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin"><LayoutDashboard className="h-4 w-4" />Admin</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/admin"><LayoutDashboard className="h-4 w-4" />Admin</Link>
              </Button>
              <Button asChild variant="premium">
                <Link href="/branches"><MapPinned className="h-4 w-4" /><span className="hidden sm:inline">Branches</span></Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile right: theme + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {mounted ? (
              isDark ? <Moon className="h-5 w-5 text-neon" /> : <Sun className="h-5 w-5 text-brass" />
            ) : <span className="h-5 w-5" aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass mx-auto mt-2 max-w-7xl rounded-lg p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-black/10 dark:border-white/10" />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500">
                  <User className="h-4 w-4 text-lagoon" />
                  {user.name}
                </div>
                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-lagoon hover:bg-lagoon/10">
                    <LayoutDashboard className="h-4 w-4" />Admin Dashboard
                  </Link>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" />Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin" onClick={() => setMenuOpen(false)}><LayoutDashboard className="h-4 w-4" />Admin</Link>
                </Button>
                <Button asChild variant="premium" className="w-full">
                  <Link href="/branches" onClick={() => setMenuOpen(false)}><MapPinned className="h-4 w-4" />Branches</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
