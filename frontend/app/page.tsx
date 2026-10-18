"use client";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Volume2,
  BookOpen,
  Heart,
  Gamepad2,
  MessageCircle,
  RotateCcw,
  Star,
} from "lucide-react";
type Msg = { role: "bot" | "child"; text: string };
type ChatData = {
  learner_id: string;
  reply: string;
  mode: string;
  level: number;
  streak: number;
  latency_ms: number;
};
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const starters = [
  { text: "Let’s learn!", icon: BookOpen },
  { text: "I am sad", icon: Heart },
  { text: "Let’s play a game", icon: Gamepad2 },
  { text: "Hello!", icon: MessageCircle },
];
export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hello, little star! 🌟 I am Ollie the Owl. Want to learn English or play?",
    },
  ]);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [level, setLevel] = useState(1),
    [streak, setStreak] = useState(0),
    [mode, setMode] = useState("welcome"),
    [draft, setDraft] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      setLearnerId(localStorage.getItem("littlelingo_learner"));
    } catch {}
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?'-]/g, ""));
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
  async function submit(value = draft) {
    const message = value.trim();
    if (!message || loading) return;
    setDraft("");
    setError("");
    setMessages((m) => [...m, { role: "child", text: message }]);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(learnerId ? { learner_id: learnerId } : {}),
        }),
      });
      const data: ChatData | { error: string } = await r.json();
      if (!r.ok || "error" in data)
        throw new Error("error" in data ? data.error : "Server error");
      setLearnerId(data.learner_id);
      try {
        localStorage.setItem("littlelingo_learner", data.learner_id);
      } catch {}
      setLevel(data.level);
      setStreak(data.streak);
      setMode(data.mode);
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch {
      setError("Ollie cannot connect right now. Please try again. 💛");
    } finally {
      setLoading(false);
    }
  }
  function reset() {
    try {
      localStorage.removeItem("littlelingo_learner");
    } catch {}
    setLearnerId(null);
    setLevel(1);
    setStreak(0);
    setMode("welcome");
    setMessages([
      { role: "bot", text: "A fresh adventure! 🌈 What shall we learn?" },
    ]);
    setError("");
  }
  return (
    <main className="min-h-screen p-4 md:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="rounded-3xl bg-violet-200 w-16 h-16 flex items-center justify-center text-4xl"
              aria-hidden
            >
              🦉
            </div>
            <div>
              <h1 className="text-3xl font-black text-violet-800">
                LittleLingo
              </h1>
              <p className="text-sm text-slate-500">
                Learn English with Ollie!
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-2xl bg-yellow-100 px-4 py-3 font-bold text-amber-800">
              ⭐ Level {level}
            </span>
            <span className="rounded-2xl bg-pink-100 px-4 py-3 font-bold text-pink-800">
              🔥 {streak}
            </span>
          </div>
        </header>
        <section className="rounded-[32px] bg-white shadow-xl border border-violet-100 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold">Chat with Ollie 🦉</h2>
              <p className="text-sm text-violet-100">Mode: {mode}</p>
            </div>
            <button
              aria-label="Start over"
              title="Start over"
              onClick={reset}
              className="rounded-full p-3 bg-white/20 hover:bg-white/30"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          <div
            className="h-[390px] overflow-y-auto p-5 space-y-5"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "child" ? "justify-end" : "justify-start"} gap-2`}
              >
                {m.role === "bot" && <div className="text-2xl">🦉</div>}
                <div
                  className={`max-w-[78%] rounded-3xl p-4 text-base md:text-lg leading-relaxed font-medium ${m.role === "bot" ? "bg-violet-50 text-slate-700 rounded-tl-sm" : "bg-sky-500 text-white rounded-tr-sm"}`}
                >
                  {m.text}
                  {m.role === "bot" && (
                    <button
                      aria-label="Read aloud"
                      className="ml-3 align-middle text-violet-600 hover:text-violet-900"
                      onClick={() => speak(m.text)}
                    >
                      <Volume2 size={19} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-violet-600">Ollie is thinking…</p>}
            {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            )}
            <div ref={end} />
          </div>
          <div className="p-4 border-t bg-slate-50">
            <p className="text-sm font-semibold text-slate-500 mb-3">
              Try saying...
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {starters.map((s) => (
                <button
                  key={s.text}
                  disabled={loading}
                  onClick={() => submit(s.text)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border bg-white py-3 px-2 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                >
                  <s.icon size={16} />
                  {s.text}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex gap-2"
            >
              <label htmlFor="chat-text" className="sr-only">
                Your message
              </label>
              <input
                id="chat-text"
                maxLength={240}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type something fun..."
                className="min-w-0 flex-1 rounded-2xl border border-violet-200 px-4 py-4 text-lg"
              />
              <button
                disabled={loading || !draft.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 rounded-2xl disabled:opacity-50"
                aria-label="Send message"
              >
                <Send />
              </button>
            </form>
          </div>
        </section>
        <p className="text-center text-xs text-slate-500 mt-4">
          For kids under 7 • No account needed • Ask a trusted grown-up for help
          when needed 💛
        </p>
      </div>
    </main>
  );
}
