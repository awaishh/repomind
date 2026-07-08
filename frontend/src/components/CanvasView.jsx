import { useState, useCallback } from "react";
import { useRepoStore } from "@/store";
import {
  Folder, FolderOpen, FileCode, FileText, FileJson,
  File, ChevronRight, ChevronDown, X, Layers, Check,
} from "lucide-react";

/* ── Icon map ───────────────────────────────────────────── */
const EXT_ICON = {
  ".js": FileCode, ".jsx": FileCode, ".ts": FileCode, ".tsx": FileCode,
  ".py": FileCode, ".go": FileCode, ".rs": FileCode, ".java": FileCode,
  ".rb": FileCode, ".json": FileJson, ".md": FileText, ".txt": FileText,
  ".yaml": FileText, ".yml": FileText, ".toml": FileText, ".css": FileCode,
  ".html": FileCode, ".scss": FileCode,
};

const EXT_COLOR = {
  ".js": "#e5c07b", ".jsx": "#61afef", ".ts": "#4a9eff", ".tsx": "#4a9eff",
  ".py": "#c678dd", ".go": "#56b6c2", ".rs": "#e06c75", ".java": "#e5c07b",
  ".rb": "#e06c75", ".json": "#98c379", ".md": "#abb2bf", ".css": "#61afef",
  ".html": "#e06c75", ".scss": "#c678dd",
};

/* ── Build nested tree from flat array ──────────────────── */
function buildTree(fileTree) {
  const root = fileTree.find(n => n.type === "directory" && (n.path === "." || n.path === ""));
  if (!root) return [];

  function getChildren(node) {
    return (node.children || [])
      .map(childPath => fileTree.find(n => n.path === childPath))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });
  }

  function buildNode(node) {
    if (node.type === "directory") {
      return { ...node, children: getChildren(node).map(buildNode) };
    }
    return node;
  }

  return getChildren(root).map(buildNode);
}

/* ── File row ───────────────────────────────────────────── */
function FileRow({ node, depth, scopedFiles, onScopeChange }) {
  const Icon = EXT_ICON[node.extension] || File;
  const color = EXT_COLOR[node.extension] || "#636d83";
  const isScoped = scopedFiles.includes(node.path);

  return (
    <div
      onClick={() => onScopeChange(
        isScoped ? scopedFiles.filter(f => f !== node.path) : [...scopedFiles, node.path]
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
      className={`
        flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer group
        transition-all duration-100 select-none
        ${isScoped
          ? "bg-white/8 text-white"
          : "text-[#636d83] hover:text-[#abb2bf] hover:bg-white/4"
        }
      `}
    >
      <Icon style={{ width: 13, height: 13, color: isScoped ? "#fff" : color, flexShrink: 0 }} />
      <span className="text-xs font-mono truncate flex-1">{node.name}</span>
      {isScoped && (
        <Check style={{ width: 10, height: 10, color: "#98c379", flexShrink: 0 }} />
      )}
    </div>
  );
}

/* ── Folder row ─────────────────────────────────────────── */
function FolderRow({ node, depth, scopedFiles, onScopeChange }) {
  const [open, setOpen] = useState(depth < 2);

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ paddingLeft: depth * 16 + 8 }}
        className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer select-none
          text-[#4b5263] hover:text-[#636d83] hover:bg-white/3 transition-all duration-100 group"
      >
        {open
          ? <ChevronDown style={{ width: 11, height: 11, flexShrink: 0 }} />
          : <ChevronRight style={{ width: 11, height: 11, flexShrink: 0 }} />
        }
        {open
          ? <FolderOpen style={{ width: 13, height: 13, color: "#e5c07b", flexShrink: 0 }} />
          : <Folder style={{ width: 13, height: 13, color: "#e5c07b", flexShrink: 0 }} />
        }
        <span className="text-xs font-medium truncate flex-1 font-mono">{node.name}</span>
        <span className="text-[10px] text-[#2a2a2a] group-hover:text-[#3a3a3a] ml-1">
          {node.children?.length}
        </span>
      </div>

      {open && node.children?.map(child => (
        child.type === "directory"
          ? <FolderRow key={child.path} node={child} depth={depth + 1} scopedFiles={scopedFiles} onScopeChange={onScopeChange} />
          : <FileRow key={child.path} node={child} depth={depth + 1} scopedFiles={scopedFiles} onScopeChange={onScopeChange} />
      ))}
    </div>
  );
}

/* ── Main canvas ────────────────────────────────────────── */
export default function CanvasView({ scopedFiles, onScopeChange }) {
  const { currentRepo } = useRepoStore();

  if (!currentRepo?.fileTree) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xs text-[#3a3a3a] font-mono">No file tree</p>
      </div>
    );
  }

  const tree = buildTree(currentRepo.fileTree);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#161616] flex-shrink-0">
        <span className="text-[10px] text-[#3a3a3a] font-mono uppercase tracking-widest">
          Explorer
        </span>
        {scopedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4b5263] font-mono">
              {scopedFiles.length} scoped
            </span>
            <button
              onClick={() => onScopeChange([])}
              className="text-[#2a2a2a] hover:text-[#ef4444] transition-colors cursor-pointer"
            >
              <X style={{ width: 11, height: 11 }} />
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="px-4 py-2 border-b border-[#111] flex-shrink-0">
        <p className="text-[10px] text-[#252525] font-mono">
          click files to add to AI context
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {tree.map(node => (
          node.type === "directory"
            ? <FolderRow key={node.path} node={node} depth={0} scopedFiles={scopedFiles} onScopeChange={onScopeChange} />
            : <FileRow key={node.path} node={node} depth={0} scopedFiles={scopedFiles} onScopeChange={onScopeChange} />
        ))}
      </div>

      {/* Scoped files footer */}
      {scopedFiles.length > 0 && (
        <div className="border-t border-[#161616] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers style={{ width: 11, height: 11, color: "#3a3a3a" }} />
            <span className="text-[10px] text-[#3a3a3a] font-mono uppercase tracking-widest">
              Context · {scopedFiles.length}
            </span>
          </div>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {scopedFiles.map(f => (
              <div key={f} className="flex items-center justify-between gap-2 group">
                <span className="text-[10px] text-[#3a3a3a] font-mono truncate">
                  {f.split("/").slice(-2).join("/")}
                </span>
                <button
                  onClick={() => onScopeChange(scopedFiles.filter(s => s !== f))}
                  className="text-[#252525] hover:text-[#ef4444] transition-colors cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <X style={{ width: 10, height: 10 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
