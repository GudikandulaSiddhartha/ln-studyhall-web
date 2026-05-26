"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BookOpen, LayoutDashboard, MapPinned, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="glass mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg px-3">
        <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white shadow-warm dark:bg-white dark:text-ink">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="hidden text-base sm:inline">LN StudyHall</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {mounted ? (
              isDark ? <Moon className="h-5 w-5 text-neon" /> : <Sun className="h-5 w-5 text-brass" />
            ) : (
              <span className="h-5 w-5" aria-hidden />
            )}
          </Button>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <Button asChild variant="premium">
            <Link href="/branches">
              <MapPinned className="h-4 w-4" />
              <span className="hidden sm:inline">Branches</span>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
