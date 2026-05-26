"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Languages, Mic, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SpeechRecognitionResultEvent = Event & {
  results: {
    0: {
      0: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionInstance = {
  lang: string;
  onresult: (event: SpeechRecognitionResultEvent) => void;
  start: () => void;
};

const quickAnswers = [
  "Monthly plan includes a dedicated seat, attendance history, and pause option.",
  "Premium Cabin Plan is best for 24/7 access, privacy, power backup, and long exam preparation.",
  "Suggested study timing: 6 AM to 10 AM for revision, 7 PM to 11 PM for deep practice.",
  "You can book a seat from the booking page and verify attendance with a QR code."
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I am LN AI Assistant. Ask me about plans, seats, branches, or study timings." }
  ]);

  const supportsVoice = useMemo(() => typeof window !== "undefined" && "webkitSpeechRecognition" in window, []);

  function sendMessage(text = input) {
    if (!text.trim()) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const answer = quickAnswers[Math.floor(Math.random() * quickAnswers.length)];
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
      setThinking(false);
    }, 900);
  }

  function startVoice() {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.start();
  }

  return (
    <>
      <Button size="icon" variant="premium" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-glow" aria-label="Open LN AI Assistant" onClick={() => setOpen(true)}>
        <Bot className="h-6 w-6" />
      </Button>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }} className="glass fixed bottom-24 right-4 z-50 flex h-[34rem] w-[calc(100vw-2rem)] max-w-md flex-col rounded-lg p-4 shadow-2xl sm:right-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-lagoon/15 text-lagoon">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">LN AI Assistant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Multilingual booking help</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close chatbot" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto rounded-lg bg-white/35 p-3 dark:bg-slate-950/35">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === "assistant" ? "mr-8 rounded-lg bg-white p-3 text-sm shadow dark:bg-slate-900" : "ml-8 rounded-lg bg-lagoon p-3 text-sm font-medium text-ink"}>
                  {message.text}
                </div>
              ))}
              {thinking ? (
                <div className="mr-8 flex gap-1 rounded-lg bg-white p-3 dark:bg-slate-900">
                  {[0, 1, 2].map((dot) => (
                    <motion.span key={dot} animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.12 }} className="h-2 w-2 rounded-full bg-lagoon" />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="icon" variant="outline" aria-label="Voice input" onClick={startVoice} disabled={!supportsVoice}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" aria-label="Language support">
                <Languages className="h-4 w-4" />
              </Button>
              <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Ask about plans or booking" className="h-11 min-w-0 flex-1 rounded-md border border-black/10 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-lagoon dark:border-white/10 dark:bg-slate-950/70" />
              <Button size="icon" variant="premium" aria-label="Send message" onClick={() => sendMessage()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
