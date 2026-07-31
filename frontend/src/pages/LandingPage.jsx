import { useNavigate } from "react-router-dom";
import { GitBranch, MessageSquare, Layers, ArrowRight, Zap, Search, Code2 } from "lucide-react";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Link any repo",
    desc: "Paste a GitHub URL and we'll connect, parse, and index it in minutes.",
  },
  {
    icon: Layers,
    title: "Visual file tree",
    desc: "Explore the codebase as an interactive node graph. Click to zoom in.",
  },
  {
    icon: MessageSquare,
    title: "Ask anything",
    desc: "Chat with AI that actually reads your code — RAG-powered, context-aware.",
  },
  {
    icon: Search,
    title: "Scoped retrieval",
    desc: "Pin specific files so the AI focuses exactly where you need it to.",
  },
  {
    icon: Zap,
    title: "Instant embeddings",
    desc: "Every chunk is vectorized into semantic embeddings for precision.",
  },
  {
    icon: Code2,
    title: "Multi-language",
    desc: "Works with JS, TS, Python, Go, Rust, Java — whatever you throw at it.",
  },
];

const MARQUEE_ITEMS = [
  "React", "Next.js", "Express", "FastAPI", "Rust", "Go", "Django", "Rails",
  "Vue", "Svelte", "Nest.js", "Spring Boot", "Laravel", "Flutter", "SwiftUI",
  "React", "Next.js", "Express", "FastAPI", "Rust", "Go", "Django", "Rails",
];

export default function LandingPage({ theme, setTheme }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-subtle">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-sketch text-2xl text-white tracking-wide">RepoMind</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-[#737373] hover:text-white transition-colors px-3 py-1.5 cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14">
        {/* dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        {/* radial fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* badge */}
          <div
            className="inline-flex items-center gap-2 border border-[#262626] rounded-full px-4 py-1.5 text-xs text-[#737373] mb-8 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-slow" />
            AI-powered code intelligence
          </div>

          {/* headline */}
          <h1
            className="font-sketch text-6xl sm:text-7xl md:text-8xl leading-[1.1] mb-6 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Understand any
            <br />
            <span className="text-gradient">codebase,</span>
            <br />
            instantly.
          </h1>

          <p
            className="text-lg text-[#737373] max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.35s" }}
          >
            Link a GitHub repo, explore the file tree visually, and chat with an AI
            that has actually read every line of code.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <button
              onClick={() => navigate("/register")}
              className="group flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#e5e5e5] transition-all duration-200 border-glow cursor-pointer"
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 border border-[#262626] px-8 py-3.5 rounded-full text-sm text-[#a3a3a3] hover:border-[#404040] hover:text-white transition-all duration-200 cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* preview card */}
        <div
          className="relative z-10 mt-20 w-full max-w-2xl mx-auto animate-slide-up"
          style={{ animationDelay: "0.65s" }}
        >
          <div className="landing-preview rounded-2xl overflow-hidden border border-[#1f1f1f]" style={{ background: "#0d0d0d" }}>

            {/* window bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#1f1f1f]" />
                <div className="w-3 h-3 rounded-full bg-[#1f1f1f]" />
                <div className="w-3 h-3 rounded-full bg-[#1f1f1f]" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-[11px] text-[#2a2a2a] font-mono tracking-wide">repomind — ask anything</span>
              </div>
            </div>

            {/* chat body */}
            <div className="px-6 py-6 space-y-5">

              {/* user message */}
              <div className="flex justify-end">
                <div
                  className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white max-w-[70%]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  How is this project structured?
                </div>
              </div>

              {/* ai response */}
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#111", border: "1px solid #1f1f1f" }}
                >
                  <span className="font-sketch text-xs text-white leading-none">R</span>
                </div>
                <div className="flex-1 space-y-2.5">
                  <p className="text-sm text-[#737373] leading-relaxed">
                    The project follows a{" "}
                    <span className="text-[#d4d4d4] font-medium">layered MVC pattern</span>
                    {" "}— controllers handle requests, services contain business logic, and models define the data schema.
                  </p>

                  {/* file path pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "src/controllers/",
                      "src/services/",
                      "src/models/",
                    ].map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-mono px-2.5 py-1 rounded-md text-[#404040]"
                        style={{ background: "#111", border: "1px solid #1a1a1a" }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* second user message */}
              <div className="flex justify-end">
                <div
                  className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white max-w-[70%]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Which file handles rate limiting?
                </div>
              </div>

              {/* ai response 2 — typing */}
              <div className="flex gap-3 items-center">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#111", border: "1px solid #1f1f1f" }}
                >
                  <span className="font-sketch text-xs text-white leading-none">R</span>
                </div>
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* input bar */}
            <div className="px-5 pb-5">
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}
              >
                <span className="flex-1 text-sm text-[#2a2a2a] font-mono">Ask anything about this codebase…</span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "#1a1a1a", border: "1px solid #222" }}
                >
                  <ArrowRight className="w-3 h-3 text-[#333]" />
                </div>
              </div>
            </div>

          </div>

          {/* subtle glow underneath */}
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-12 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
          />
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0a0a0a)" }} />
      </section>

      {/* ── Marquee ─────────────────────────────────────── */}
      <section className="py-10 border-y border-[#1a1a1a] overflow-hidden">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-sm text-[#404040] font-mono uppercase tracking-widest flex-shrink-0">
              {item}
              <span className="ml-8 text-[#262626]">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#404040] font-mono uppercase tracking-widest mb-4">What it does</p>
            <h2 className="font-sketch text-5xl md:text-6xl text-gradient leading-tight">
              Everything you need to<br />understand code
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="glass rounded-xl p-6 border-[#1a1a1a] hover:border-[#333] transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center mb-4 group-hover:border-[#404040] transition-colors">
                  <Icon className="w-5 h-5 text-[#737373] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-sketch text-xl text-white mb-2">{title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#404040] font-mono uppercase tracking-widest mb-4">Process</p>
            <h2 className="font-sketch text-5xl text-gradient">Three steps.</h2>
          </div>

          <div className="space-y-6">
            {[
              { n: "01", title: "Paste a GitHub URL", body: "Enter any public repository URL. We link it, walk every file, and chunk the code into semantic pieces." },
              { n: "02", title: "AI indexes the code", body: "Every chunk is vectorized into semantic embeddings and stored for lightning-fast semantic search." },
              { n: "03", title: "Ask your questions", body: "Your question triggers a retrieval pass — the most relevant chunks are fetched and fed to the AI for a grounded, accurate answer." },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-6 glass rounded-xl p-6 border-[#1a1a1a] hover:border-[#2a2a2a] transition-all">
                <span className="font-sketch text-4xl text-[#333] flex-shrink-0 leading-none">{n}</span>
                <div>
                  <h3 className="font-sketch text-2xl text-white mb-1">{title}</h3>
                  <p className="text-sm text-[#737373] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-sketch text-6xl md:text-7xl text-gradient mb-6 leading-tight">
            Ready to explore?
          </h2>
          <p className="text-[#737373] mb-10">
            Free to use. No credit card required.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="group inline-flex items-center gap-2 bg-white text-black px-10 py-4 rounded-full font-semibold hover:bg-[#e5e5e5] transition-all duration-200 border-glow cursor-pointer"
          >
            Get started free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a1a] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-sketch text-xl text-[#404040]">RepoMind</span>
         
        </div>
      </footer>
    </div>
  );
}
