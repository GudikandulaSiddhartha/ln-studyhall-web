import { Navbar } from "@/components/navbar";
import { SignInForm } from "@/components/signin-form";

export default function SignInPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Sign in</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Welcome back</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Access your seat booking, membership dates, reminders, payment history, and admin tools from one calm workspace.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-lg p-5">
              <p className="text-sm font-semibold text-lagoon">Student access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Continue booking seats and tracking your monthly plan.</p>
            </div>
            <div className="glass rounded-lg p-5">
              <p className="text-sm font-semibold text-brass">Admin access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Review bookings, branches, seats, revenue, and notifications.</p>
            </div>
          </div>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
