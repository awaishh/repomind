import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderGit2, MessageSquare, Plus } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useRepoStore } from "@/store";

export default function QnaPage({ theme, setTheme }) {
    const navigate = useNavigate();
    const { repos, fetchRepos } = useRepoStore();

    useEffect(() => {
        queueMicrotask(fetchRepos);
    }, [fetchRepos]);

    return (
        <div className="app-page min-h-screen bg-[#f6f8fb] font-sans text-[#182133]">
            <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#e4e9f1] bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
                    <span className="brand-wordmark text-[#182133]">RepoMind</span>
                </div>
            </header>
            <AppSidebar active="qna" repos={repos} navigate={navigate} />
            <main className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:ml-64 md:pl-8">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">Q&A</p>
                <h1 className="font-sketch text-5xl tracking-tight text-[#182133]">Ask your codebase</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#687386]">
                    Choose a saved repository to ask questions about its files, architecture, and implementation.
                </p>

                {repos.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-dashed border-[#cbd7e7] bg-white px-6 py-20 text-center">
                        <FolderGit2 className="mx-auto mb-4 h-10 w-10 text-[#b8c8df]" />
                        <h2 className="text-lg font-semibold text-[#182133]">Link a repository first</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-[#8a94a5]">Your Q&A workspace is created for each saved GitHub repository.</p>
                        <button onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> Link repository
                        </button>
                    </div>
                ) : (
                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {repos.map((repo) => (
                            <button key={repo._id} onClick={() => navigate(`/repo/${repo._id}`)} className="flex items-center gap-4 rounded-2xl border border-[#e4e9f1] bg-white p-5 text-left shadow-[0_8px_28px_rgba(24,33,51,0.04)] transition-colors hover:border-blue-300 hover:bg-[#fbfdff]">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-blue-600"><MessageSquare className="h-5 w-5" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#182133]">{repo.owner}/{repo.name}</span><span className="mt-1 block text-xs text-[#8a94a5]">Open Q&A workspace</span></span>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
