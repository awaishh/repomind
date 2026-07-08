import { useCallback, useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, FileCode2, FolderOpen, Loader2, PanelLeftOpen, Send, Sparkles, ArrowLeft, Code2, ExternalLink } from "lucide-react";
import { useRepoStore } from "@/store";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

function sortTree(nodes) {
    return [...nodes].sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === "directory" ? -1 : 1;
    });
}

function buildTreeFromNodes(nodes) {
    const root = { name: "workspace", path: "", type: "directory", children: [] };

    const insert = (node) => {
        const segments = node.path.split("/").filter(Boolean);
        let current = root;

        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;
            const nodeType = isLast ? node.type : "directory";
            const childPath = segments.slice(0, index + 1).join("/");
            let child = current.children.find((item) => item.name === segment && item.type === nodeType);

            if (!child) {
                child = {
                    name: segment,
                    path: childPath,
                    type: nodeType,
                    extension: nodeType === "file" ? node.extension || "" : "",
                    children: [],
                };
                current.children.push(child);
            }

            current = child;
        });
    };

    nodes.forEach(insert);
    root.children = sortTree(root.children).map((child) => ({ ...child, children: sortTree(child.children) }));
    return root.children;
}

function TreeNode({ node, selectedPath, onSelect, mode }) {
    const isSelected = selectedPath === node.path;

    if (node.type === "directory") {
        return (
            <div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-md text-[#a3a3a3] hover:bg-[#111] hover:text-white transition-colors">
                    <span className="text-[11px] text-[#404040]">{">"}</span>
                    <span className="text-sm truncate">{node.name}</span>
                </div>
                <div className="ml-3 border-l border-[#1a1a1a] pl-2">
                    {node.children.map((child) => (
                        <TreeNode key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} mode={mode} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onSelect(node.path, mode)}
            className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
                isSelected ? "bg-[#1a1a1a] text-white" : "text-[#737373] hover:bg-[#111] hover:text-white"
            )}
        >
            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{node.name}</span>
        </button>
    );
}

export default function CodeEditorPage() {
    const { repoId } = useParams();
    const navigate = useNavigate();
    const { currentRepo, fetchRepo } = useRepoStore();

    const [treeData, setTreeData] = useState([]);
    const [selectedPath, setSelectedPath] = useState("");
    const [selectedContent, setSelectedContent] = useState("");
    const [selectedMode, setSelectedMode] = useState(repoId ? "repo" : "local");
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [isLocalWorkspace, setIsLocalWorkspace] = useState(!repoId);
    const [workspaceFiles, setWorkspaceFiles] = useState([]);
    const [assistantInput, setAssistantInput] = useState("");
    const [assistantMessages, setAssistantMessages] = useState([]);
    const [assistantLoading, setAssistantLoading] = useState(false);
    const [workspaceError, setWorkspaceError] = useState("");

    useEffect(() => {
        if (repoId) {
            setSelectedMode("repo");
            setIsLocalWorkspace(false);
            fetchRepo(repoId).catch(() => navigate("/dashboard"));
        }
    }, [repoId, fetchRepo, navigate]);

    useEffect(() => {
        if (currentRepo?.fileTree?.length) {
            const builtTree = buildTreeFromNodes(currentRepo.fileTree);
            setTreeData(builtTree);
            const firstFile = currentRepo.fileTree.find((node) => node.type === "file");
            if (firstFile && !selectedPath) {
                void handleSelectFile(firstFile.path, "repo");
            }
        }
    }, [currentRepo]);

    const handleSelectFile = useCallback(async (pathToOpen, mode = "repo") => {
        setSelectedPath(pathToOpen);
        setSelectedMode(mode);

        if (mode === "local") {
            const file = workspaceFiles.find((item) => item.path === pathToOpen);
            setSelectedContent(file?.content || "");
            return;
        }

        setIsLoadingFile(true);
        try {
            const res = await api.get(`/repo/${repoId}/file`, { params: { path: pathToOpen } });
            setSelectedContent(res.data.data.content || "");
        } catch {
            setSelectedContent("Unable to load this file right now.");
        } finally {
            setIsLoadingFile(false);
        }
    }, [repoId, workspaceFiles]);

    useEffect(() => {
        if (selectedMode === "local" && workspaceFiles.length && !selectedPath) {
            const firstFile = workspaceFiles[0];
            setSelectedPath(firstFile.path);
            setSelectedContent(firstFile.content);
        }
    }, [selectedMode, selectedPath, workspaceFiles]);

    const handleOpenLocalFolder = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        try {
            const loadedFiles = [];
            for (const file of files) {
                const relativePath = (file.webkitRelativePath || file.name)
                    .split("/")
                    .slice(1)
                    .join("/");
                if (!relativePath) continue;
                const content = await file.text();
                loadedFiles.push({ path: relativePath, content });
            }

            const unique = loadedFiles.filter((item, index, arr) => arr.findIndex((entry) => entry.path === item.path) === index);
            setWorkspaceFiles(unique);
            setTreeData(buildTreeFromNodes(unique.map((item) => ({ path: item.path, type: "file", extension: item.path.split(".").pop() || "" }))));
            setIsLocalWorkspace(true);
            setWorkspaceError("");

            if (unique[0]) {
                setSelectedPath(unique[0].path);
                setSelectedContent(unique[0].content);
                setSelectedMode("local");
            }
        } catch {
            setWorkspaceError("Unable to read the selected folder. Try again with a smaller directory.");
        }
    };

    const assistantDisabled = !repoId;

    const handleAskAssistant = async () => {
        const question = assistantInput.trim();
        if (!question || assistantLoading || assistantDisabled) return;

        setAssistantLoading(true);
        setAssistantMessages((prev) => [...prev, { role: "user", content: question }]);
        setAssistantInput("");

        try {
            const res = await api.post("/chat/message", {
                repoId,
                message: question,
                scopedFiles: selectedPath ? [selectedPath] : [],
            });

            setAssistantMessages((prev) => [...prev, { role: "assistant", content: res.data.data.response, sources: res.data.data.sources || [] }]);
        } catch (err) {
            const message = err.response?.data?.message || "The assistant could not answer this question right now.";
            setAssistantMessages((prev) => [...prev, { role: "assistant", content: message }]);
        } finally {
            setAssistantLoading(false);
        }
    };

    const headerTitle = useMemo(() => {
        if (repoId && currentRepo) return `${currentRepo.owner}/${currentRepo.name}`;
        return isLocalWorkspace ? "Local workspace" : "Open a repository or folder";
    }, [currentRepo, isLocalWorkspace, repoId]);

    const activeFileName = useMemo(() => selectedPath?.split("/").pop() || "untitled", [selectedPath]);
    const language = useMemo(() => {
        const ext = selectedPath?.split(".").pop()?.toLowerCase() || "";
        const map = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            json: "json",
            md: "markdown",
            css: "css",
            html: "html",
            bash: "shell",
            sh: "shell",
        };
        return map[ext] || "plaintext";
    }, [selectedPath]);

    return (
        <div className="h-screen flex bg-[#060606] text-white overflow-hidden">
            <aside className="w-[300px] border-r border-[#1a1a1a] bg-[#0b0b0b] flex flex-col">
                <div className="border-b border-[#1a1a1a] p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.28em] text-[#404040]">Explorer</p>
                            <h2 className="text-sm font-semibold text-white">{headerTitle}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="rounded-lg p-2 text-[#737373] hover:bg-[#111] hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-[#d4d4d4] transition-colors hover:border-[#333]">
                        <FolderOpen className="w-4 h-4" />
                        Open local folder
                        <input type="file" className="hidden" webkitdirectory="" multiple onChange={handleOpenLocalFolder} />
                    </label>
                </div>

                <div className="flex-1 overflow-auto p-3">
                    {treeData.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#1f1f1f] p-4 text-sm text-[#404040]">
                            Open a cloned repo or a local folder to start exploring files.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {treeData.map((node) => (
                                <TreeNode key={node.path || node.name} node={node} selectedPath={selectedPath} onSelect={handleSelectFile} mode={selectedMode} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-[#1a1a1a] p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#404040]">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI assistant
                    </div>

                    <div className="space-y-2 rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-2">
                        {assistantMessages.length === 0 ? (
                            <p className="text-xs leading-5 text-[#737373]">
                                {assistantDisabled
                                    ? "AI chat is available for cloned repositories only. Open a repo from the dashboard to use this assistant."
                                    : "Ask questions about the opened file and get grounded answers from the repository context."}
                            </p>
                        ) : (
                            assistantMessages.slice(-4).map((msg, index) => (
                                <div key={`${msg.role}-${index}`} className={cn("rounded-lg px-2.5 py-2 text-sm", msg.role === "user" ? "bg-[#1a1a1a] text-white" : "bg-[#111] text-[#d4d4d4]")}>
                                    {msg.content}
                                </div>
                            ))
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                value={assistantInput}
                                onChange={(e) => setAssistantInput(e.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void handleAskAssistant();
                                    }
                                }}
                                placeholder={assistantDisabled ? "Open a cloned repo to ask questions" : "Ask about this file"}
                                disabled={assistantDisabled}
                                className={cn(
                                    "flex-1 rounded-lg border px-3 py-2 text-sm placeholder:text-[#404040] focus:outline-none",
                                    assistantDisabled
                                        ? "border-[#2a2a2a] bg-[#090909] text-[#555]"
                                        : "border border-[#1f1f1f] bg-[#111] text-white"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => void handleAskAssistant()}
                                disabled={assistantLoading || assistantDisabled}
                                className="rounded-lg bg-white p-2 text-black transition-colors hover:bg-[#e5e5e5] disabled:opacity-50"
                            >
                                {assistantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        {workspaceError && <p className="text-[11px] text-[#ef4444]">{workspaceError}</p>}
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[#404040]">Editor</p>
                        <div className="flex items-center gap-2 text-sm text-white">
                            <PanelLeftOpen className="w-4 h-4 text-[#404040]" />
                            <span className="font-medium">{selectedPath || "No file selected"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {repoId && currentRepo && (
                            <button
                                type="button"
                                onClick={() => navigate(`/repo/${repoId}`)}
                                className="flex items-center gap-2 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2 text-sm text-[#d4d4d4] transition-colors hover:border-[#333]"
                            >
                                <Code2 className="w-4 h-4" />
                                Open repo view
                            </button>
                        )}
                        {repoId && currentRepo && (
                            <a
                                href={currentRepo.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-[#1f1f1f] bg-[#111] p-2 text-[#d4d4d4] transition-colors hover:border-[#333]"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4">
                    {!selectedPath ? (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#1f1f1f] bg-[#090909] text-center text-sm text-[#404040]">
                            <div>
                                <Bot className="mx-auto mb-3 h-8 w-8 text-[#404040]" />
                                <p>Select a file from the explorer to start reading it here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#111] px-3 py-2">
                                <div className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#181818] px-3 py-1.5 text-xs text-[#e5e5e5]">
                                    <FileCode2 className="w-3.5 h-3.5 text-[#737373]" />
                                    <span>{activeFileName}</span>
                                </div>
                                <span className="text-[11px] uppercase tracking-[0.24em] text-[#404040]">
                                    {selectedMode === "repo" ? "Repository file" : "Local file"}
                                </span>
                            </div>

                            {isLoadingFile ? (
                                <div className="flex flex-1 items-center justify-center text-sm text-[#737373]">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading file content…
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-1 overflow-hidden">
                                        <Editor
                                            height="100%"
                                            language={language}
                                            value={selectedContent}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                wordWrap: "on",
                                                automaticLayout: true,
                                                scrollBeyondLastLine: false,
                                                readOnly: selectedMode !== "local",
                                                padding: { top: 16, bottom: 16 },
                                                glyphMargin: false,
                                                lineNumbersMinChars: 3,
                                                tabSize: 2,
                                            }}
                                            onChange={(value) => {
                                                if (selectedMode === "local") {
                                                    setSelectedContent(value || "");
                                                    setWorkspaceFiles((prev) => prev.map((item) => (item.path === selectedPath ? { ...item, content: value || "" } : item)));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#1a1a1a] bg-[#0d0d0d] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[#404040]">
                                        <span>{selectedMode === "repo" ? "read-only" : "editable"}</span>
                                        <span>{selectedContent.split("\n").length} lines</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
