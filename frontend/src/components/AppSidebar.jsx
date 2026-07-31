import {
    FolderGit2,
    GitCommit,
    MonitorPlay,
    MessageSquare,
    Users,
    Archive,
} from "lucide-react";

export default function AppSidebar({ active, repos, navigate, showRepositories = true }) {
    const navigation = [
        ...(showRepositories ? [{ key: "repositories", label: "Repositories", icon: FolderGit2, path: "/dashboard" }] : []),
        { key: "commits", label: "Commit reader", icon: GitCommit, path: "/commits" },
        { key: "meetings", label: "Meeting Room", icon: MonitorPlay, path: "/meetings" },
        { key: "qna", label: "Q&A", icon: MessageSquare, path: "/qna" },
    ];

    return (
        <aside className="app-sidebar fixed bottom-0 left-0 top-16 z-30 hidden w-64 border-r border-[#e4e9f1] bg-white px-4 py-7 md:flex md:flex-col">
            <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a94a5]">Application</p>
            <nav className="space-y-1">
                {navigation.map(({ key, label, icon: Icon, path }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => navigate(path)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active === key
                            ? "bg-blue-600 font-semibold text-white shadow-sm"
                            : "font-medium text-[#687386] hover:bg-[#f1f4f8] hover:text-[#182133]"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </nav>

            <p className="mb-3 mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a94a5]">Saved projects</p>
            <div className="space-y-1 overflow-y-auto">
                {repos?.slice(0, 8).map((repo) => (
                    <div key={repo._id} className="group">
                        <button
                            type="button"
                            onClick={() => navigate(`/repo/${repo._id}`)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#687386] transition-colors hover:bg-[#f1f4f8] hover:text-[#182133]"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#edf4ff] text-[11px] font-semibold text-blue-600">
                                {repo.name?.[0]?.toUpperCase()}
                            </span>
                            <span className="truncate">{repo.name}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/repo/${repo._id}`)}
                            className="ml-9 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-[#8a94a5] transition-colors hover:bg-[#edf4ff] hover:text-blue-600"
                        >
                            <MessageSquare className="h-3 w-3" />
                            Q&A
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/repo/${repo._id}?panel=team`)}
                            className="ml-9 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-[#8a94a5] transition-colors hover:bg-[#edf4ff] hover:text-blue-600"
                        >
                            <Users className="h-3 w-3" />
                            Collaborators
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/repo/${repo._id}?panel=archive`)}
                            className="ml-9 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-[#8a94a5] transition-colors hover:bg-[#fff4f2] hover:text-red-500"
                        >
                            <Archive className="h-3 w-3" />
                            Archive
                        </button>
                    </div>
                ))}
                {!repos?.length && <p className="px-3 text-xs leading-relaxed text-[#9aa3b2]">Your linked projects will appear here.</p>}
            </div>
        </aside>
    );
}
