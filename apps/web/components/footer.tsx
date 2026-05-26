import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { contactDetails } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white/55 px-4 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="font-semibold text-ink dark:text-white">
            LN StudyHall
          </Link>
          <p className="mt-1">Help & Support: <a className="font-semibold text-lagoon" href={contactDetails.emailHref}>{contactDetails.email}</a></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 transition hover:border-lagoon hover:text-lagoon dark:border-white/10" href={contactDetails.phoneHref}>
            <Phone className="h-4 w-4" />
            {contactDetails.phone}
          </a>
          <a className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 transition hover:border-lagoon hover:text-lagoon dark:border-white/10" href={contactDetails.emailHref}>
            <Mail className="h-4 w-4" />
            Email support
          </a>
        </div>
      </div>
    </footer>
  );
}
