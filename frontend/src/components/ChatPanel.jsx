import { useState, useRef, useEffect } from "react";
import { useChatStore, useRepoStore } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Bot,
  User,
  FileCode,
  Sparkles,
  MessageSquare,
  Trash2,
  Plus,
} from "lucide-react";

function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0]?.trim() || "";
      const code = lines.slice(lang ? 1 : 0).join("\n");
      return (
        <pre key={idx} className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono">
          {lang && <div className="text-[10px] text-[#404040] mb-2 uppercase tracking-wider font-sans">{lang}</div>}
          <code className="text-[#e5e5e5]">{code}</code>
        </pre>
      );
    }
    return (
      <span key={idx} className="whitespace-pre-wrap">
        {part.split("\n").map((line, lineIdx) => {
          if (line.startsWith("### ")) return <h3 key={lineIdx} className="text-sm font-semibold mt-3 mb-1 text-white">{line.slice(4)}</h3>;
          if (line.startsWith("## "))  return <h2 key={lineIdx} className="text-base font-semibold mt-3 mb-1 text-white">{line.slice(3)}</h2>;
          if (line.startsWith("# "))   return <h1 key={lineIdx} className="text-lg font-bold mt-3 mb-1 text-white">{line.slice(2)}</h1>;
          if (line.match(/^[\s]*[-*]\s/)) {
            const indent = line.search(/\S/);
            return (
              <div key={lineIdx} className="flex gap-2 my-0.5" style={{ paddingLeft: `${Math.max(0, indent * 4)}px` }}>
                <span className="text-[#404040] mt-1.5 text-xs">·</span>
                <span>{processInline(line.replace(/^[\s]*[-*]\s/, ""))}</span>
              </div>
            );
          }
          if (line.match(/^\s*\d+\.\s/)) {
            const num = line.match(/^\s*(\d+)\.\s/)?.[1];
            return (
              <div key={lineIdx} className="flex gap-2 my-0.5">
                <span className="text-[#737373] text-sm min-w-[18px]">{num}.</span>
                <span>{processInline(line.replace(/^\s*\d+\.\s/, ""))}</span>
              </div>
            );
          }
          if (!line.trim()) return <div key={lineIdx} className="h-2" />;
          return <div key={lineIdx} className="my-0.5">{processInline(line)}</div>;
        })}
      </span>
    );
  });
}

function processInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-[#1a1a1a] border border-[#262626] px-1.5 py-0.5 rounded text-xs font-mono text-[#e5e5e5]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i} className="italic text-[#a3a3a3]">{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function ChatPanel({ repoId, scopedFiles }) {
  const {
    chats, currentChat, messages, isSending,
    fetchChats, fetchChat, sendMessage, clearChat, deleteChat,
  } = useChatStore();
  const { currentRepo } = useRepoStore();
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (repoId) fetchChats(repoId); }, [repoId, fetchChats]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    try {
      await sendMessage(repoId, text, scopedFiles, currentChat?._id);
      fetchChats(repoId);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const SUGGESTIONS = [
    "What does this project do?",
    "How is the code structured?",
    "How does authentication work?",
    "Show me the main entry point",
  ];

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* ── History sidebar ── */}
      <div className={cn(
        "border-r border-[#1a1a1a] bg-[#0d0d0d] transition-all duration-200 flex flex-col",
        showSidebar ? "w-56" : "w-0 overflow-hidden"
      )}>
        <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">History</span>
          <button onClick={() => { clearChat(); inputRef.current?.focus(); }} className="p-1 rounded hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {chats.map((chat) => (
              <button
                key={chat._id}
                onClick={async () => { await fetchChat(chat._id); setShowSidebar(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors group flex items-center justify-between cursor-pointer",
                  currentChat?._id === chat._id
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#737373] hover:bg-[#141414] hover:text-white"
                )}
              >
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat._id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#ef4444] transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-11 border-b border-[#1a1a1a] flex items-center justify-between px-4 flex-shrink-0 bg-[#0d0d0d]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded hover:bg-[#1a1a1a] text-[#404040] hover:text-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-[#737373]">{currentChat?.title || "New chat"}</span>
          </div>
          {scopedFiles.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#737373] bg-[#1a1a1a] border border-[#262626] px-2.5 py-1 rounded-full font-mono">
              <FileCode className="w-3 h-3" />
              {scopedFiles.length} file{scopedFiles.length !== 1 ? "s" : ""} scoped
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* README summary */}
            {messages.length === 0 && currentRepo?.readmeSummary && (
              <div className="animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#737373]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#404040] mb-2 font-mono uppercase tracking-wider">Project Overview</div>
                    <div className="text-sm text-[#a3a3a3] leading-relaxed">{renderMarkdown(currentRepo.readmeSummary)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {messages.length === 0 && !currentRepo?.readmeSummary && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#1f1f1f] flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-[#404040]" />
                </div>
                <h3 className="font-sketch text-2xl text-white mb-2">Ask about this codebase</h3>
                <p className="text-xs text-[#737373] max-w-xs mx-auto mb-6">
                  I can explain architecture, specific files, patterns, and anything in between.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="px-3 py-2 text-xs border border-[#1f1f1f] rounded-lg text-[#737373] hover:border-[#333] hover:text-white transition-all bg-[#111] cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3 animate-fade-in", msg.role === "user" ? "justify-end" : "")}>
                {msg.role !== "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#404040]" />
                  </div>
                )}
                <div className={cn("flex-1 min-w-0 max-w-[85%]", msg.role === "user" ? "flex justify-end" : "")}>
                  {msg.role === "user" ? (
                    <div className="bg-[#1a1a1a] border border-[#262626] rounded-2xl rounded-tr-sm px-4 py-2.5 inline-block">
                      <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-[#a3a3a3] leading-relaxed">{renderMarkdown(msg.content)}</div>
                      {msg.sources?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] bg-[#111] border border-[#1f1f1f] rounded-md px-2 py-1 text-[#404040] font-mono">
                              <FileCode className="w-2.5 h-2.5" />
                              {src.filePath}
                              <span className="text-[#262626]">:{src.startLine}-{src.endLine}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#404040]" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isSending && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#404040]" />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div key={delay} className="w-1.5 h-1.5 rounded-full bg-[#333] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-[#404040]">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-[#1a1a1a] p-4 flex-shrink-0 bg-[#0d0d0d]">
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden focus-within:border-[#333] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this codebase…"
                className="w-full bg-transparent text-sm text-white placeholder:text-[#333] resize-none px-4 py-3 pr-12 focus:outline-none min-h-[48px] max-h-[160px]"
                rows={1}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                disabled={isSending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className={cn(
                  "absolute right-2 bottom-2 p-2 rounded-lg transition-all cursor-pointer",
                  input.trim() && !isSending
                    ? "bg-white text-black hover:bg-[#e5e5e5]"
                    : "text-[#333]"
                )}
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
