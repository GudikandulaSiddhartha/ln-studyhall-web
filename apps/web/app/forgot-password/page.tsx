import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Navbar } from "@/components/navbar";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Password help</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Reset access</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Enter your account email and LN StudyHall will guide you back into your dashboard without exposing private account details.
          </p>
          <div className="mt-8 glass rounded-lg p-5">
            <p className="text-sm font-semibold text-lagoon">Secure recovery</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Reset requests use a privacy-safe response, so account status is never revealed on screen.
            </p>
          </div>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
