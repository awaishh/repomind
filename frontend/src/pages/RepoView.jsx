import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRepoStore, useChatStore } from "@/store";
import CanvasView from "@/components/CanvasView";
import ChatPanel from "@/components/ChatPanel";
import {
  ArrowLeft,
  GitBranch,
  Star,
  Loader2,
  FolderTree,
  MessageSquare,
  ExternalLink,
  PanelRightOpen,
  SquarePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";

export default function RepoView({ theme, setTheme }) {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { currentRepo, fetchRepo } = useRepoStore();
  const { clearChat } = useChatStore();
  const [scopedFiles, setScopedFiles] = useState([]);
  const [activePanel, setActivePanel] = useState("split");
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border border-[#1f1f1f]" />
            <div className="absolute inset-0 rounded-full border border-white border-t-transparent animate-spin" style={{ borderWidth: "1px" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-sketch text-lg text-[#404040]">R</span>
            </div>
          </div>
          <p className="text-sm text-[#737373]">Loading repository…</p>
        </div>
      </div>
    );
  }

  if (!currentRepo) return null;

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">

        {/* ── Top bar ────────────────────────────────────── */}
        <header className="h-12 border-b border-[#1a1a1a] flex items-center justify-between px-4 flex-shrink-0 bg-[#0d0d0d] z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-[#1a1a1a]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="w-px h-4 bg-[#1f1f1f]" />
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-[#404040]" />
              <span className="text-sm font-medium text-white">
                {currentRepo.owner}/{currentRepo.name}
              </span>
            </div>
            {currentRepo.language && (
              <span className="text-[10px] text-[#737373] bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 rounded-full font-mono">
                {currentRepo.language}
              </span>
            )}
            {currentRepo.stars > 0 && (
              <span className="flex items-center gap-1 text-xs text-[#737373]">
                <Star className="w-3 h-3" />
                {currentRepo.stars}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} compact />
            {/* View toggle */}
            <div className="flex items-center bg-[#111] border border-[#1f1f1f] rounded-lg p-0.5">
              {[
                { key: "canvas", icon: FolderTree, label: "Canvas only" },
                { key: "split", icon: PanelRightOpen, label: "Split view" },
                { key: "chat", icon: MessageSquare, label: "Chat only" },
              ].map(({ key, icon: Icon, label }) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActivePanel(key)}
                      className={cn(
                        "p-1.5 rounded-md transition-colors cursor-pointer",
                        activePanel === key
                          ? "bg-[#1f1f1f] text-white"
                          : "text-[#404040] hover:text-[#737373]"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <button
              onClick={() => navigate(`/editor/${repoId}`)}
              className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors"
              title="Open in editor"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>
            <a
              href={currentRepo.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* ── Content ────────────────────────────────────── */}
        <div className="flex-1 flex min-h-0">
          <div
            className={cn(
              "transition-all duration-300 border-r border-[#1a1a1a]",
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
        </div>
      </div>
    </TooltipProvider>
  );
}
