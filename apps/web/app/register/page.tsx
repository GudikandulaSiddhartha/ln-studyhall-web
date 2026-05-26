import { RegisterForm } from "@/components/register-form";
import { Navbar } from "@/components/navbar";

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Register</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Join LN StudyHall</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Create a student account for seat booking and membership tracking, or register an authorized admin with a private invite code.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-lg p-5">
              <p className="text-sm font-semibold text-lagoon">User dashboard</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Seat booking, profile, attendance, payments, and notifications.</p>
            </div>
            <div className="glass rounded-lg p-5">
              <p className="text-sm font-semibold text-brass">Admin access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Branches, bookings, analytics, memberships, photos, and notifications.</p>
            </div>
          </div>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
