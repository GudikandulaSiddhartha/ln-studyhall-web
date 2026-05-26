import { BookingBoard } from "@/components/booking-board";
import { Chatbot } from "@/components/chatbot";
import { Navbar } from "@/components/navbar";

export default function BookingPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Navbar />
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.26em] text-lagoon">Booking</p>
          <h1 className="font-display text-5xl font-semibold tracking-normal md:text-7xl">Choose your quiet seat</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">Animated seat selection, payment handoff, and QR verification are ready for API integration.</p>
        </div>
        <BookingBoard />
      </div>
      <Chatbot />
    </main>
  );
}
