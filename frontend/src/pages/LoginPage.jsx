import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── LEFT: Form panel ───────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-10 lg:p-16 relative">
        {/* top nav */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#737373] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back home
          </Link>
        </div>

        {/* form centered vertically */}
        <div className="w-full max-w-md mx-auto animate-slide-up">
          <div className="mb-10">
            <span className="font-sketch text-3xl text-white block mb-6">RepoMind</span>
            <h1 className="font-sketch text-5xl text-white mb-2 leading-tight">Welcome back</h1>
            <p className="text-[#737373]">Sign in to continue exploring code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#737373] uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-[#0d0d0d] border border-[#262626] rounded-xl px-5 py-4 text-base text-white placeholder:text-[#333] focus:outline-none focus:border-[#555] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#737373] uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-xl px-5 py-4 pr-12 text-base text-white placeholder:text-[#333] focus:outline-none focus:border-[#555] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#404040] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-semibold text-base hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Signing in…</>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-[#737373] mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-white hover:underline underline-offset-2 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* bottom spacer */}
        <div className="text-xs text-[#333] font-mono">© RepoMind</div>
      </div>

      {/* ── RIGHT: Grid decorative panel ──────────────── */}
      <div
        className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden border-l border-[#1a1a1a]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundColor: "#080808",
        }}
      >
        {/* radial fade from center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,0.03) 0%, #080808 70%)",
          }}
        />

        {/* floating card */}
        <div className="relative z-10 max-w-xs text-center px-8 animate-fade-in">
          <p className="font-sketch text-4xl text-[#404040] leading-snug mb-6">
            "The best way to understand code is to ask it questions."
          </p>
          <span className="text-xs text-[#2a2a2a] font-mono uppercase tracking-widest">— RepoMind</span>
        </div>

        <div className="absolute bottom-8 right-8 text-[10px] text-[#1f1f1f] font-mono uppercase tracking-widest">
          RAG · Codebase AI · Vector Search
        </div>
      </div>
    </div>
  );
}
