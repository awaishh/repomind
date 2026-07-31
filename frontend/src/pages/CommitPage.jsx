import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    GitCommit,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import AppSidebar from "@/components/AppSidebar";
import { useRepoStore } from "@/store";

function CommitItem({ commit }) {
    const [showDiff, setShowDiff] = useState(false);

    return (
        <article className="border-b border-[#e4e9f1] p-6 last:border-0 hover:bg-[#fbfdff] transition-colors">
            <div className="flex items-start gap-3.5">
                <img
                    src={commit.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commit.authorName || "G")}&background=edf4ff&color=2563eb&size=64`}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full border border-[#d8e0eb] bg-[#edf4ff]"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#182133]">{commit.authorName || "Unknown author"}</span>
                        {commit.authorLogin && <span className="text-xs text-[#687386]">@{commit.authorLogin}</span>}
                        {commit.committedAt && <span className="text-xs text-[#8a94a5]">{new Date(commit.committedAt).toLocaleString()}</span>}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-[#182133]">{commit.message?.split("\n")[0]}</h3>
                    <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs text-[#687386] sm:grid-cols-2">
                        <div><dt className="inline font-medium text-[#687386]">Commit hash: </dt><dd className="inline break-all font-mono text-[#182133]">{commit.sha}</dd></div>
                        <div><dt className="inline font-medium text-[#687386]">Author: </dt><dd className="inline text-[#182133]">{commit.authorName || "Unknown author"}</dd></div>
                        <div><dt className="inline font-medium text-[#687386]">Date: </dt><dd className="inline text-[#182133]">{commit.committedAt ? new Date(commit.committedAt).toLocaleDateString() : "Unknown"}</dd></div>
                        <div><dt className="inline font-medium text-[#687386]">Diff: </dt><dd className="inline text-[#182133]">{commit.diff ? "Saved" : "Unavailable"}</dd></div>
                    </dl>
                    {commit.summary && (
                        <p className="mt-4 rounded-xl border border-[#e4e9f1] bg-[#f6f8fb] p-4 text-sm leading-relaxed text-[#3c4257]">
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#687386]">Summary</span>
                            {commit.summary}
                        </p>
                    )}
                    <button
                        onClick={() => setShowDiff((open) => !open)}
                        className="mt-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#687386] transition-colors hover:text-blue-600 cursor-pointer"
                    >
                        {showDiff ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {showDiff ? "Hide git diff" : "Read git diff"}
                    </button>
                    {showDiff && (
                        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-[#e4e9f1] bg-[#f6f8fb] p-4 font-mono text-xs leading-relaxed text-[#3c4257]">
                            {commit.diff || "Diff unavailable."}
                        </pre>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function CommitPage({ theme, setTheme }) {
    const navigate = useNavigate();
    const { repos, fetchRepos } = useRepoStore();
    const [githubUrl, setGithubUrl] = useState("");
    const [workspaces, setWorkspaces] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadWorkspaces = async () => {
        try {
            const response = await api.get("/commits");
            setWorkspaces(response.data.data || []);
        } catch {
            toast.error("Could not load saved commit workspaces");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(() => { loadWorkspaces(); fetchRepos(); });
    }, [fetchRepos]);

    const handleSync = async (event) => {
        event.preventDefault();
        if (!githubUrl.trim()) return;
        setSyncing(true);
        try {
            const response = await api.post("/commits/sync", { githubUrl: githubUrl.trim() });
            const saved = response.data.data;
            setWorkspaces((current) => [saved, ...current.filter((item) => item._id !== saved._id)]);
            setGithubUrl("");
            toast.success("Commits fetched, summarized, and saved");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not fetch commits");
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/commits/${id}`);
            setWorkspaces((current) => current.filter((item) => item._id !== id));
            toast.success("Commit workspace deleted");
        } catch {
            toast.error("Could not delete workspace");
        }
    };

    return (
        <div className="app-page min-h-screen bg-white text-[#182133]">
            <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#e7eaf0] bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
                    <span className="brand-wordmark text-[#182133]">RepoMind</span>
                </div>
            </header>

            <AppSidebar active="commits" repos={repos} navigate={navigate} />

            <main className="mx-auto min-w-0 max-w-[1440px] px-6 pb-20 pt-10 md:ml-64 md:pl-12 lg:pr-12">
                <div className="mb-8">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#737373]">Independent workspace</p>
                    <h1 className="font-sketch text-4xl tracking-tight text-[#182133]">Commit reader</h1>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#687386]">Paste a GitHub repository URL to review recent commit messages, diffs, and summaries.</p>
                </div>

                <form onSubmit={handleSync} className="mb-10 rounded-xl border border-[#e4e9f1] bg-white p-5 shadow-[0_8px_28px_rgba(24,33,51,0.04)]">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#182133]"><Plus className="h-4 w-4" /> New commit workspace</div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            value={githubUrl}
                            onChange={(event) => setGithubUrl(event.target.value)}
                            placeholder="https://github.com/owner/repository"
                            className="min-w-0 flex-1 rounded-lg border border-[#d8e0eb] bg-white px-4 py-3 font-mono text-sm text-[#182133] placeholder:text-[#9aa3b2] outline-none transition-colors focus:border-blue-400"
                            disabled={syncing}
                        />
                        <button disabled={syncing || !githubUrl.trim()} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {syncing ? "Fetching…" : "Fetch commits"}
                        </button>
                    </div>
                    <p className="mt-3 text-[11px] text-[#8a94a5]">Fetch recent changes, read the full diff, and keep a concise summary for each commit.</p>
                </form>

                {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#687386]" /></div> : workspaces.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#d8e0eb] bg-white px-6 py-20 text-center">
                        <GitCommit className="mx-auto mb-4 h-8 w-8 text-[#8a94a5]" />
                        <p className="text-sm text-[#687386]">No saved commit workspaces yet.</p>
                    </div>
                ) : workspaces.map((workspace) => (
                    <section key={workspace._id} className="mb-8 overflow-hidden rounded-xl border border-[#e4e9f1] bg-white shadow-[0_8px_28px_rgba(24,33,51,0.04)]">
                        <div className="flex flex-wrap items-center gap-3 border-b border-[#e7eaf0] p-5">
                            <GitCommit className="h-5 w-5 text-blue-600" />
                            <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-[#182133]">{workspace.owner}/{workspace.name}</h2><p className="font-mono text-[10px] text-[#8a94a5]">Synced {new Date(workspace.syncedAt).toLocaleString()}</p></div>
                            <a href={workspace.githubUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-[#687386] transition-colors hover:bg-[#f1f4f8] hover:text-[#182133]"><ExternalLink className="h-4 w-4" /></a>
                            <button onClick={() => handleDelete(workspace._id)} className="rounded-lg p-2 text-[#687386] transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {workspace.commits?.map((commit) => <CommitItem key={commit.sha} commit={commit} />)}
                    </section>
                ))}
            </main>
        </div>
    );
}
