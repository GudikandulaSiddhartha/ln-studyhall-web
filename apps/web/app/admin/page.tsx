import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Building2, ImagePlus, MessageSquareText, UserCog } from "lucide-react";

const actions = [
  { label: "Manage branches", icon: Building2 },
  { label: "Add study hall photos", icon: ImagePlus },
  { label: "Manage memberships", icon: UserCog },
  { label: "Send notifications", icon: Bell },
  { label: "Chatbot responses", icon: MessageSquareText }
];

export default function AdminPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Admin</p>
            <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Operations command center</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Manage bookings, branches, photos, revenue, users, notifications, memberships, and assistant responses.</p>
          </div>
          <Button variant="premium">Export monthly report</Button>
        </div>
        <div className="mb-6 grid gap-3 md:grid-cols-5">
          {actions.map((action) => (
            <Card key={action.label} className="p-4">
              <action.icon className="mb-3 h-5 w-5 text-lagoon" />
              <p className="text-sm font-semibold">{action.label}</p>
            </Card>
          ))}
        </div>
        <AnalyticsDashboard />
      </div>
    </main>
  );
}
