import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRepoStore, useChatStore } from "@/store";
import CanvasView from "@/components/CanvasView";
import ChatPanel from "@/components/ChatPanel";
import ProjectInsights from "@/components/ProjectInsights";
import {
  ArrowLeft,
  GitBranch,
  Star,
  FolderTree,
  MessageSquare,
  ExternalLink,
  PanelRightOpen,
  Sparkles,
  Code2,
  Users,
  Archive,
  MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function RepoView({ theme, setTheme }) {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const panelFromUrl = new URLSearchParams(window.location.search).get("panel");
  const { currentRepo, fetchRepo, setCurrentRepo } = useRepoStore();
  const { clearChat } = useChatStore();
  const [scopedFiles, setScopedFiles] = useState([]);
  const [activePanel, setActivePanel] = useState(panelFromUrl || "chat");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchRepo(repoId);
        clearChat();
      } catch {
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [repoId, fetchRepo, clearChat, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border border-[#e4e9f1]" />
            <div className="absolute inset-0 rounded-full border border-blue-600 border-t-transparent animate-spin" style={{ borderWidth: "2px" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-[#687386]">R</span>
            </div>
          </div>
          <p className="text-sm text-[#687386]">Loading repository…</p>
        </div>
      </div>
    );
  }

  if (!currentRepo) return null;

  return (
    <TooltipProvider>
      <div className="app-page h-screen flex flex-col bg-[#f6f8fb] font-sans overflow-hidden">

        {/* ── Top bar ────────────────────────────────────── */}
        <header className="h-16 border-b border-[#e4e9f1] flex items-center justify-between px-5 flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-[#687386] hover:text-[#182133] transition-colors cursor-pointer py-1.5 px-2 rounded-md hover:bg-[#f1f4f8]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="w-px h-5 bg-[#e4e9f1]" />
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-[#182133]">
                {currentRepo.owner}/{currentRepo.name}
              </span>
            </div>
            {currentRepo.language && (
              <span className="text-[10px] text-[#687386] bg-[#f1f4f8] border border-[#e4e9f1] px-2 py-0.5 rounded-full font-mono">
                {currentRepo.language}
              </span>
            )}
            {currentRepo.stars > 0 && (
              <span className="flex items-center gap-1 text-xs text-[#687386]">
                <Star className="w-3 h-3" />
                {currentRepo.stars}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle floating pill */}
            <div className="flex items-center bg-[#f1f5f9] border border-[#e2e8f0] rounded-full p-1 shadow-sm">
              {[
                { key: "canvas", icon: FolderTree, label: "Canvas view" },
                { key: "split", icon: PanelRightOpen, label: "Canvas + Q&A split" },
                { key: "chat", icon: MessageSquare, label: "Q&A chat" },
                { key: "insights", icon: Sparkles, label: "Insights & Overview" },
              ].map(({ key, icon: Icon, label }) => {
                const isActive = activePanel === key;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActivePanel(key)}
                        className={cn(
                          "p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                            : "text-[#64748b] hover:text-[#0f172a] hover:bg-white/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{label}</TooltipContent>
                  </Tooltip>
                );
              })}

              <div className="w-px h-4 bg-[#cbd5e1] mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={currentRepo.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-white/60 transition-all duration-200 flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom">Open GitHub Repository</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <aside className="w-64 shrink-0 border-r border-[#e4e9f1] bg-white p-5 hidden md:flex flex-col">
            <p className="px-2 py-2 text-[10px] text-[#9aa3b2] uppercase tracking-[0.18em] font-semibold">Project</p>
            {[
              { key: "insights", label: "Overview", icon: Sparkles },
              { key: "chat", label: "Q&A", icon: MessageSquare },
              { key: "canvas", label: "Code explorer", icon: Code2 },
              { key: "commits", label: "Commits & diffs", icon: GitBranch },
              { key: "meetings", label: "Meetings", icon: MonitorPlay },
              { key: "team", label: "Collaborators", icon: Users },
              { key: "archive", label: "Archive", icon: Archive },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActivePanel(key)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer",
                  activePanel === key ? "bg-blue-600 text-white font-semibold shadow-sm" : "text-[#687386] hover:bg-[#f1f4f8] hover:text-[#182133]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            <div className="mt-auto px-2 pt-4 text-xs text-[#9aa3b2] leading-relaxed">
              RAG indexing starts only when you ask a Q&A question.
            </div>
          </aside>
          {/* Insights panel — full width when active */}
          {["insights", "commits", "meetings", "team", "archive"].includes(activePanel) && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <ProjectInsights
                key={activePanel}
                initialTab={activePanel === "insights" ? "commits" : activePanel}
                repo={currentRepo}
                onArchiveChanged={setCurrentRepo}
              />
            </div>
          )}

          {/* Canvas + Chat panels — only mounted when not on insights */}
          {["canvas", "split", "chat"].includes(activePanel) && (
            <>
              <div
                className={cn(
                  "transition-all duration-300 border-r border-[#e4e9f1]",
                  activePanel === "canvas" ? "flex-1" : activePanel === "split" ? "w-1/2" : "w-0 overflow-hidden border-0"
                )}
              >
                <CanvasView scopedFiles={scopedFiles} onScopeChange={setScopedFiles} />
              </div>
              <div
                className={cn(
                  "transition-all duration-300",
                  activePanel === "chat" ? "flex-1" : activePanel === "split" ? "w-1/2" : "w-0 overflow-hidden"
                )}
              >
                <ChatPanel repoId={repoId} scopedFiles={scopedFiles} />
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
