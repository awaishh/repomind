import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useRepoStore } from "@/store";
import {
  GitBranch,
  LogOut,
  Plus,
  Loader2,
  Star,
  Trash2,
  ExternalLink,
  FolderGit2,
  ArrowRight,
  Clock,
  Code2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_MAP = {
  cloning: { label: "Cloning…", color: "text-[#737373]", dot: "bg-[#737373]" },
  parsing: { label: "Parsing…", color: "text-[#a3a3a3]", dot: "bg-[#a3a3a3]" },
  embedding: { label: "Embedding…", color: "text-[#d4d4d4]", dot: "bg-[#d4d4d4]" },
  ready: { label: "Ready", color: "text-white", dot: "bg-white" },
  error: { label: "Error", color: "text-[#ef4444]", dot: "bg-[#ef4444]" },
};

export default function Dashboard({ theme, setTheme }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { repos, fetchRepos, cloneRepo, pollStatus, deleteRepo, isLoading } = useRepoStore();

  const [showModal, setShowModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [processingRepoId, setProcessingRepoId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState("");

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  useEffect(() => {
    if (!processingRepoId) return;
    const interval = setInterval(async () => {
      try {
        const repo = await pollStatus(processingRepoId);
        setProcessingStatus(repo.status);
        if (repo.status === "ready") {
          clearInterval(interval);
          setProcessingRepoId(null);
          setShowModal(false);
          toast.success("Repository ready!");
          fetchRepos();
          navigate(`/repo/${repo._id}`);
        } else if (repo.status === "error") {
          clearInterval(interval);
          setProcessingRepoId(null);
          toast.error(repo.errorMessage || "Processing failed");
        }
      } catch {
        clearInterval(interval);
        setProcessingRepoId(null);
        setCloning(false);
        toast.error("Lost connection");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [processingRepoId, pollStatus, fetchRepos, navigate]);

  const handleClone = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) { toast.error("Enter a GitHub URL"); return; }
    setCloning(true);
    try {
      const data = await cloneRepo(githubUrl.trim());
      setProcessingRepoId(data.repoId);
      setProcessingStatus("cloning");
      setGithubUrl("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Clone failed");
      setCloning(false);
    }
  };

  const handleDelete = async (repoId, e) => {
    e.stopPropagation();
    try {
      await deleteRepo(repoId);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-subtle">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-sketch text-2xl text-white">RepoMind</span>
          <div className="flex items-center gap-4">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-xs font-medium text-[#737373]">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-[#737373] hidden sm:block">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────── */}
      <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto">

        {/* Hero */}
        <div className="mb-12 animate-slide-up">
          <h1 className="font-sketch text-5xl md:text-6xl text-white mb-3">
            Your Repositories
          </h1>
          <p className="text-[#737373] max-w-lg">
            Clone a GitHub repo and start asking questions. AI reads every file.
          </p>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#e5e5e5] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Clone repo
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={() => navigate("/editor")}
            className="flex items-center gap-2 border border-[#1f1f1f] bg-[#111] px-5 py-2.5 rounded-full text-sm font-semibold text-[#d4d4d4] hover:border-[#333] hover:text-white transition-all cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            Open editor
          </button>
          <span className="text-[#333] text-sm">{repos.length} {repos.length === 1 ? "repo" : "repos"}</span>
        </div>

        {/* Repo grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#404040]" />
          </div>
        ) : repos.length === 0 ? (
          <div className="border border-dashed border-[#1f1f1f] rounded-2xl p-16 text-center animate-fade-in">
            <FolderGit2 className="w-10 h-10 text-[#333] mx-auto mb-4" />
            <h3 className="font-sketch text-3xl text-[#404040] mb-2">No repos yet</h3>
            <p className="text-sm text-[#333] mb-6">Clone a public GitHub repository to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Clone your first repo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo, i) => {
              const st = STATUS_MAP[repo.status] || STATUS_MAP.error;
              return (
                <div
                  key={repo._id}
                  onClick={() => repo.status === "ready" && navigate(`/repo/${repo._id}`)}
                  className={`glass rounded-xl p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 group animate-slide-up ${repo.status === "ready" ? "cursor-pointer" : "cursor-default"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <GitBranch className="w-4 h-4 text-[#404040] flex-shrink-0" />
                      <span className="font-medium text-white truncate">{repo.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {repo.status === "ready" && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/editor/${repo._id}`); }}
                            className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors"
                            title="Open in editor"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={repo.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={(e) => handleDelete(repo._id, e)}
                        className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-[#404040] hover:text-[#ef4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#404040] font-mono mb-3 truncate">{repo.owner}/{repo.name}</p>

                  {repo.description && (
                    <p className="text-xs text-[#737373] mb-3 line-clamp-2 leading-relaxed">{repo.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <span className="flex items-center gap-1.5 text-[#404040]">
                          <Code2 className="w-3 h-3" />
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="flex items-center gap-1 text-[#404040]">
                          <Star className="w-3 h-3" />
                          {repo.stars}
                        </span>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 font-medium ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${repo.status !== "ready" && repo.status !== "error" ? "animate-pulse-slow" : ""}`} />
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Clone Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !cloning && !processingRepoId && setShowModal(false)}
          />

          <div className="relative z-10 w-full max-w-md glass rounded-2xl border border-[#1f1f1f] p-6 animate-slide-up border-glow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-sketch text-2xl text-white">Clone Repository</h2>
                <p className="text-xs text-[#737373] mt-0.5">Enter a public GitHub repository URL</p>
              </div>
              {!processingRepoId && (
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#737373] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {processingRepoId ? (
              <div className="py-6 text-center space-y-5">
                {/* spinner */}
                <div className="relative mx-auto w-14 h-14">
                  <div className="absolute inset-0 rounded-full border border-[#1f1f1f]" />
                  <div className="absolute inset-0 rounded-full border border-white border-t-transparent animate-spin" style={{ borderWidth: "1px" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-sketch text-lg text-[#404040]">R</span>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-white text-sm">
                    {STATUS_MAP[processingStatus]?.label || processingStatus}
                  </p>
                  <p className="text-xs text-[#737373] mt-1">This may take a minute for large repos</p>
                </div>

                {/* progress steps */}
                <div className="flex items-center justify-center gap-2">
                  {["cloning", "parsing", "embedding"].map((step, idx) => {
                    const steps = ["cloning", "parsing", "embedding"];
                    const currentIdx = steps.indexOf(processingStatus);
                    return (
                      <div
                        key={step}
                        className={`h-0.5 w-14 rounded-full transition-all duration-500 ${currentIdx >= idx ? "bg-white" : "bg-[#1f1f1f]"
                          }`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleClone} className="space-y-4">
                <input
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={cloning}
                  autoFocus
                  className="w-full bg-[#111] border border-[#262626] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#404040] focus:outline-none focus:border-[#444] transition-colors font-mono"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={cloning}
                    className="flex-1 py-2.5 rounded-lg border border-[#262626] text-sm text-[#737373] hover:text-white hover:border-[#404040] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cloning}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-[#e5e5e5] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {cloning ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Starting…</>
                    ) : (
                      <><GitBranch className="w-4 h-4" />Clone & Analyze</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
