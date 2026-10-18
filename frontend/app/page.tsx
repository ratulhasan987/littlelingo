"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Heart,
  Home as HomeIcon,
  Lightbulb,
  Menu,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Volume2,
  WandSparkles,
  X,
  Zap,
  Gamepad2,
  Smile,
  CheckCircle2,
  Trophy,
  Coffee,
  ShieldAlert,
  Rocket,
  PartyPopper,
  Sun,
} from "lucide-react";

type MessageType =
  | "learning"
  | "success"
  | "hint"
  | "achievement"
  | "support"
  | "urgent"
  | "break"
  | "engagement"
  | "conversation";
type BotUI = { type: MessageType; icon?: string; animation?: string };
type Msg = { role: "bot" | "child"; text: string; ui?: BotUI };
const messageIcons = {
  learning: BookOpen,
  success: CheckCircle2,
  hint: Lightbulb,
  achievement: Trophy,
  support: Heart,
  urgent: ShieldAlert,
  break: Coffee,
  engagement: Gamepad2,
  conversation: MessageCircle,
} as const;
function MessageTypeIcon({ type }: { type: MessageType }) {
  const Icon = messageIcons[type] ?? BookOpen;
  return (
    <span
      className={`message-type-icon message-type-${type}`}
      aria-hidden="true"
    >
      <Icon size={17} strokeWidth={2.3} />
    </span>
  );
}
type ChatData = {
  learner_id: string;
  reply: string;
  mode: string;
  level: number;
  streak: number;
  latency_ms: number;
  ui?: BotUI;
};
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const greeting =
  "Hello, little star! I am Ollie, your English buddy. What shall we do today?";
const starters = [
  {
    text: "Let's learn!",
    label: "Learn words",
    icon: BookOpen,
    color: "lilac",
  },
  {
    text: "Let's play a game",
    label: "Play a game",
    icon: Gamepad2,
    color: "peach",
  },
  { text: "Hello!", label: "Just chat", icon: MessageCircle, color: "mint" },
  { text: "I am sad", label: "My feelings", icon: Heart, color: "pink" },
] as const;

function Ollie({ size = "normal" }: { size?: "normal" | "small" | "large" }) {
  return (
    <div className={`ollie owl-${size}`} aria-label="Ollie the owl" role="img">
      <div className="owl-ear owl-ear-left" />
      <div className="owl-ear owl-ear-right" />
      <div className="owl-wing owl-wing-left" />
      <div className="owl-wing owl-wing-right" />
      <div className="owl-face">
        <div className="owl-eye">
          <i />
        </div>
        <div className="owl-eye">
          <i />
        </div>
        <div className="owl-beak" />
      </div>
      <div className="owl-foot owl-foot-left" />
      <div className="owl-foot owl-foot-right" />
    </div>
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    text.replace(/[^\w\s.,!?'-]/g, ""),
  );
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: greeting },
  ]);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState("welcome");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setLearnerId(localStorage.getItem("littlelingo_learner"));
    } catch {}
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function submit(value = draft) {
    const message = value.trim();
    if (!message || loading) return;
    setDraft("");
    setError("");
    setSidebarOpen(false);
    setMessages((m) => [...m, { role: "child", text: message }]);
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(learnerId ? { learner_id: learnerId } : {}),
        }),
      });
      const data: ChatData | { error: string } = await response.json();
      if (!response.ok || "error" in data)
        throw new Error("error" in data ? data.error : "Server error");
      setLearnerId(data.learner_id);
      try {
        localStorage.setItem("littlelingo_learner", data.learner_id);
      } catch {}
      setLevel(data.level);
      setStreak(data.streak);
      setMode(data.mode);
      setMessages((m) => [
        ...m,
        { role: "bot", text: data.reply, ui: data.ui },
      ]);
    } catch {
      setError(
        "Ollie cannot connect right now. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
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
      { role: "bot", text: "A fresh adventure! What shall we learn together?" },
    ]);
    setError("");
    setResetOpen(false);
    setSidebarOpen(false);
  }

  const modeLabel: Record<string, string> = {
    welcome: "Ready to explore",
    learning: "Learning time",
    conversation: "Chatting together",
    engagement: "Play time",
    support: "Feelings & kindness",
  };
  const currentMode = modeLabel[mode.toLowerCase()] || mode.replace(/_/g, " ");

  return (
    <main className="app-shell">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-owl">
            <Ollie size="small" />
          </div>
          <div>
            <div className="brand-name">
              little<span>lingo</span>
              <span className="brand-dot">.</span>
            </div>
            <div className="brand-caption">A world of little words</div>
          </div>
          <button
            className="close-sidebar"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="side-section-title">YOUR SPACE</div>
        <nav aria-label="Main navigation" className="side-nav">
          <button
            className="nav-item nav-active"
            onClick={() => setSidebarOpen(false)}
          >
            <HomeIcon size={20} strokeWidth={2.3} /> My learning space{" "}
            <span className="nav-active-dot" />
          </button>
          <button
            className="nav-item"
            onClick={() => submit("Let's learn!")}
            disabled={loading}
          >
            <BookOpen size={20} /> Learn English{" "}
            <ArrowRight size={15} className="nav-trail" />
          </button>
          <button
            className="nav-item"
            onClick={() => submit("Let's play a game")}
            disabled={loading}
          >
            <Gamepad2 size={20} /> Play & learn{" "}
            <ArrowRight size={15} className="nav-trail" />
          </button>
          <button
            className="nav-item"
            onClick={() => submit("I want to talk about my feelings")}
            disabled={loading}
          >
            <Heart size={20} /> My feelings{" "}
            <ArrowRight size={15} className="nav-trail" />
          </button>
        </nav>
        <div className="side-section-title journey-title">MY JOURNEY</div>
        <div className="journey-card">
          <div className="journey-card-top">
            <span className="journey-icon">
              <Star size={18} fill="currentColor" />
            </span>
            <span className="journey-level">Level {level} of 3</span>
          </div>
          <strong>
            {level === 1
              ? "Little Starter"
              : level === 2
                ? "Word Explorer"
                : "Super Speaker"}
          </strong>
          <p>
            {level === 1
              ? "Every great story begins with a word!"
              : level === 2
                ? "You are growing your word power!"
                : "Look how far you have come!"}
          </p>
          <div className="level-track">
            <span style={{ width: `${(level / 3) * 100}%` }} />
          </div>
          <div className="journey-dots">
            <span className="dot-complete">1</span>
            <span className={level >= 2 ? "dot-complete" : ""}>2</span>
            <span className={level >= 3 ? "dot-complete" : ""}>3</span>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="safe-note">
            <ShieldCheck size={20} />
            <span>A happy, safe place to learn</span>
          </div>
          <button className="restart-link" onClick={() => setResetOpen(true)}>
            <RotateCcw size={17} /> Start a new adventure
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="topbar-eyebrow">
              YOUR LEARNING SPACE <Sparkles size={13} />
            </div>
            <h1>
              Let&apos;s learn something <span>amazing!</span>
            </h1>
          </div>
          <div className="topbar-actions">
            <div className="header-pill level-pill">
              <span>
                <Star size={17} fill="currentColor" />
              </span>{" "}
              Level {level}
            </div>
            <div className="header-pill streak-pill">
              <span>
                <Zap size={17} fill="currentColor" />
              </span>{" "}
              {streak} streak
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="chat-column">
            <section className="welcome-banner">
              <div className="welcome-stars star-one">
                <Sparkles size={22} />
              </div>
              <div className="welcome-stars star-two">
                <Star size={17} fill="currentColor" />
              </div>
              <div className="welcome-sun">
                <Sun size={25} />
              </div>
              <div className="welcome-copy">
                <div className="banner-kicker">
                  <span /> YOUR FRIENDLY ENGLISH BUDDY
                </div>
                <h2>
                  Big adventures, <span>little words!</span>
                </h2>
                <p>
                  I&apos;m Ollie! Ready for a new adventure in English? Every
                  little word is a big win.
                </p>
                <button
                  className="banner-button"
                  onClick={() => submit("Let's learn!")}
                  disabled={loading}
                >
                  Start exploring <Rocket size={19} />
                </button>
              </div>
              <div className="banner-mascot">
                <div className="mascot-halo" />
                <div className="orbit-ring" />
                <Ollie size="large" />
                <div className="mascot-spark mascot-spark-a">
                  <Star size={18} fill="currentColor" />
                </div>
                <div className="mascot-spark mascot-spark-b">
                  <Sparkles size={24} />
                </div>
                <span className="hero-confetti confetti-a" />
                <span className="hero-confetti confetti-b" />
                <span className="hero-confetti confetti-c" />
              </div>
            </section>

            <section className="chat-card" aria-label="Chat with Ollie">
              <div className="chat-header">
                <div className="chat-header-avatar">
                  <Ollie size="small" />
                  <span className="online-dot" />
                </div>
                <div className="chat-header-text">
                  <h2>
                    Chat with Ollie{" "}
                    <span className="bot-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </h2>
                  <div className="status-line">
                    <span className="status-indicator" />
                    {currentMode}
                  </div>
                </div>
                <div className="chat-header-right">
                  <span className="friendly-chip">
                    <Heart size={14} /> Your friendly buddy
                  </span>
                  <button
                    className="chat-icon-btn"
                    title="Start new chat"
                    aria-label="Start a new adventure"
                    onClick={() => setResetOpen(true)}
                  >
                    <RotateCcw size={19} />
                  </button>
                </div>
              </div>
              <div
                className="chat-messages"
                aria-live="polite"
                aria-relevant="additions"
              >
                <div className="chat-today">
                  <span>
                    <Sparkles size={13} /> Our happy little conversation
                  </span>
                </div>

                {messages.map((message, index) => {
                  const isBot = message.role === "bot";

                  return (
                    <div
                      key={index}
                      className={`message-row ${
                        isBot ? "message-bot" : "message-child"
                      }`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: isBot ? "flex-start" : "flex-end",
                        gap: "12px",
                        width: "100%",
                      }}
                    >
                      {/* Ollie Avatar */}
                      {isBot && (
                        <div
                          className="message-avatar"
                          style={{
                            flexShrink: 0,
                            width: "44px",
                            height: "44px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: 0,
                            position: "relative",
                            top: 0,
                            left: 0,
                            transform: "none",
                          }}
                        >
                          <Ollie size="small" />
                        </div>
                      )}

                      {/* Message Content */}
                      <div
                        className="message-body"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isBot ? "flex-start" : "flex-end",
                          gap: "8px",
                          flex: "0 1 auto",
                          minWidth: 0,
                          maxWidth: isBot
                            ? "min(100%, 520px)"
                            : "min(85%, 440px)",
                          margin: 0,
                          padding: 0,
                          transform: "none",
                        }}
                      >
                        {/* Bot Name */}
                        {isBot && (
                          <div
                            className="message-author"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              margin: 0,
                              padding: 0,
                              lineHeight: "20px",
                            }}
                          >
                            <strong>Ollie</strong>
                            <span>• Your buddy</span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`message-bubble ${
                            isBot && message.ui
                              ? `message-bubble-${message.ui.type}`
                              : ""
                          }`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "fit-content",
                            maxWidth: "100%",
                            minHeight: "48px",
                            margin: 0,
                            padding: "14px 18px",
                            borderRadius: isBot
                              ? "8px 20px 20px 20px"
                              : "20px 8px 20px 20px",
                            lineHeight: "1.6",
                            overflowWrap: "anywhere",
                            position: "relative",
                            transform: "none",
                          }}
                        >
                          {isBot && message.ui && (
                            <MessageTypeIcon type={message.ui.type} />
                          )}

                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              lineHeight: "1.6",
                            }}
                          >
                            {message.text}
                          </span>
                        </div>

                        {/* Listen Button */}
                        {isBot && (
                          <button
                            type="button"
                            className="listen-button"
                            aria-label="Read Ollie's response aloud"
                            onClick={() => speak(message.text)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: "6px",
                              margin: 0,
                              padding: "4px 2px",
                              alignSelf: "flex-start",
                              position: "relative",
                              left: 0,
                              transform: "none",
                            }}
                          >
                            <Volume2 size={15} strokeWidth={2} />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>

                      {/* Child Avatar */}
                      {!isBot && (
                        <div
                          className="child-avatar"
                          style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: 0,
                            transform: "none",
                          }}
                        >
                          <Smile size={20} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="message-row message-bot">
                    <div className="message-avatar">
                      <Ollie size="small" />
                    </div>
                    <div
                      className="thinking-bubble"
                      aria-label="Ollie is thinking"
                    >
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                )}
                {error && (
                  <div role="alert" className="error-banner">
                    <CircleHelp size={18} />
                    {error}
                    <button
                      onClick={() => setError("")}
                      aria-label="Dismiss error"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div ref={end} />
              </div>
              <div className="chat-composer">
                <div className="suggestion-title">
                  <Lightbulb size={16} /> Not sure what to say? Try one of
                  these!
                </div>
                <div className="suggestion-list">
                  {starters.map((item) => (
                    <button
                      key={item.text}
                      className={`suggestion-chip chip-${item.color}`}
                      disabled={loading}
                      onClick={() => submit(item.text)}
                    >
                      <item.icon size={17} strokeWidth={2.2} />
                      {item.label}
                    </button>
                  ))}
                </div>
                <form
                  className="message-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <label htmlFor="chat-text" className="sr-only">
                    Write your message
                  </label>
                  <input
                    id="chat-text"
                    ref={inputRef}
                    maxLength={240}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Say something to Ollie..."
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={loading || !draft.trim()}
                    aria-label="Send message"
                  >
                    <Send size={20} strokeWidth={2.4} />
                  </button>
                </form>
                <div className="composer-foot">
                  <ShieldCheck size={14} /> Kind words, big smiles, and little
                  steps every day <Heart size={13} fill="currentColor" />
                </div>
              </div>
            </section>
          </div>

          <aside className="right-column">
            <div className="right-heading">
              <div>
                <div className="section-eyebrow">PICK YOUR ADVENTURE</div>
                <h2>Choose your fun!</h2>
              </div>
              <Compass size={25} />
            </div>
            <div className="activity-grid">
              <button
                disabled={loading}
                className="activity-card activity-learn"
                onClick={() => submit("Let's learn!")}
              >
                <span className="activity-icon">
                  <BookOpen size={25} />
                </span>
                <span className="activity-text">
                  <strong>Learn a word</strong>
                  <small>Discover something new</small>
                </span>
                <ArrowRight size={18} className="activity-arrow" />
              </button>
              <button
                disabled={loading}
                className="activity-card activity-play"
                onClick={() => submit("Let's play a game")}
              >
                <span className="activity-icon">
                  <Gamepad2 size={25} />
                </span>
                <span className="activity-text">
                  <strong>Play a game</strong>
                  <small>Learning is fun!</small>
                </span>
                <ArrowRight size={18} className="activity-arrow" />
              </button>
              <button
                disabled={loading}
                className="activity-card activity-chat"
                onClick={() => submit("Hello!")}
              >
                <span className="activity-icon">
                  <MessageCircle size={25} />
                </span>
                <span className="activity-text">
                  <strong>Just chat</strong>
                  <small>Tell me about your day</small>
                </span>
                <ArrowRight size={18} className="activity-arrow" />
              </button>
            </div>
            <div className="growth-card">
              <div className="growth-card-header">
                <span className="growth-icon">
                  <PartyPopper size={24} />
                </span>
                <Sparkles size={20} className="growth-spark" />
              </div>
              <h3>Every star starts small!</h3>
              <p>
                You&apos;re doing great! Keep exploring, asking, and growing.
              </p>
              <div className="growth-progress">
                <span>Learning journey</span>
                <strong>Level {level} / 3</strong>
              </div>
              <div className="growth-meter">
                <span style={{ width: `${(level / 3) * 100}%` }} />
              </div>
              <div className="growth-bottom">
                <Star size={17} fill="currentColor" /> Every try makes you
                brighter!
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">
                <WandSparkles size={19} />
              </span>
              <div>
                <strong>Did you know?</strong>
                <p>Mistakes are how we learn. It&apos;s okay to try again!</p>
              </div>
            </div>
            <div className="side-footer">
              <ShieldCheck size={16} /> Made for little learners, with love.
            </div>
          </aside>
        </div>
      </section>
      {resetOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={() => setResetOpen(false)}
        >
          <div
            className="reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="modal-icon">
              <RotateCcw size={27} />
            </span>
            <h2 id="reset-title">A brand-new adventure?</h2>
            <p>
              This will start a new learning journey from Level 1. Your current
              progress won&apos;t appear in this browser anymore.
            </p>
            <div className="modal-actions">
              <button onClick={() => setResetOpen(false)}>Keep learning</button>
              <button onClick={reset}>
                Start fresh <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
