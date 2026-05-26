import { Mail, MessageCircle, Phone } from "lucide-react";
import { Chatbot } from "@/components/chatbot";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { contactDetails } from "@/lib/data";

export default function ContactPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Contact</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Talk to LN StudyHall</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Reach the LN StudyHall team for branch tours, seat booking help, membership support, and general questions.
          </p>
        </div>

        <Card className="p-5 sm:p-7">
          <h2 className="text-2xl font-semibold">Contact details</h2>
          <div className="mt-6 grid gap-3">
            <a className="glass flex items-center gap-3 rounded-lg p-4 transition hover:-translate-y-0.5 hover:border-lagoon" href={contactDetails.phoneHref}>
              <Phone className="h-5 w-5 text-lagoon" />
              <span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Mobile</span>
                <span className="font-semibold">{contactDetails.phone}</span>
              </span>
            </a>
            <a className="glass flex items-center gap-3 rounded-lg p-4 transition hover:-translate-y-0.5 hover:border-lagoon" href={contactDetails.whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="h-5 w-5 text-lagoon" />
              <span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">WhatsApp</span>
                <span className="font-semibold">{contactDetails.whatsapp}</span>
              </span>
            </a>
            <a className="glass flex items-center gap-3 rounded-lg p-4 transition hover:-translate-y-0.5 hover:border-lagoon" href={contactDetails.emailHref}>
              <Mail className="h-5 w-5 text-lagoon" />
              <span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-semibold">{contactDetails.email}</span>
              </span>
            </a>
          </div>
        </Card>
      </div>
      <Chatbot />
    </main>
  );
}
