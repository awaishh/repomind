import { useState, useEffect, useCallback } from "react";
import {
  Upload, MonitorPlay, Users, Archive,
  Loader2, Trash2, CheckCircle2,
  Clock, AlertCircle, UserPlus, X, GitCommit,
  Mic, ChevronDown, ChevronUp, ExternalLink, FileDiff, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

/* ─── helpers ──────────────────────────────────────────────── */
function timeAgo(ds) {
  if (!ds) return "";
  const s = Math.floor((Date.now() - new Date(ds)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TABS = [
  { key: "commits", label: "Commits", Icon: GitCommit },
  { key: "meetings", label: "Meetings", Icon: MonitorPlay },
  { key: "team", label: "Team", Icon: Users },
  { key: "archive", label: "Archive", Icon: Archive },
];

/* ─── Commit card ───────────────────────────────────────────── */
function CommitCard({ commit, repoUrl, repoId }) {
  const [open, setOpen] = useState(false);
  const [diff, setDiff] = useState("");
  const [summary, setSummary] = useState(commit.summary || "");
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadDiff = async () => {
    setLoadingDiff(true);
    try {
      const res = await api.get(`/repo/${repoId}/commits/${commit.sha}/diff`);
      setDiff(res.data.data?.diff || "No diff available.");
    } catch {
      toast.error("Could not load diff");
    } finally {
      setLoadingDiff(false);
    }
  };

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get(`/repo/${repoId}/commits/${commit.sha}/summary`);
      setSummary(res.data.data?.summary || "No summary available.");
      setOpen(true);
    } catch {
      toast.error("Could not generate summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="p-5 hover:bg-[#f1f4f8] transition-colors border-b border-[#e4e9f1] last:border-0">
      <div className="flex items-start gap-3">
        <img
          src={commit.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commit.authorName || "G")}&background=1a1a1a&color=737373&size=64`}
          alt=""
          className="w-9 h-9 rounded-full border border-[#e4e9f1] shrink-0 bg-[#f1f4f8]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#182133]">
              {commit.authorName || commit.authorLogin || "Unknown"}
            </span>
            <span className="text-xs text-[#9aa3b2]">{timeAgo(commit.committedAt)}</span>
            {repoUrl && (
              <a
                href={`${repoUrl}/commit/${commit.sha}`}
                target="_blank" rel="noreferrer"
                className="text-[#9aa3b2] hover:text-[#182133] ml-auto shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-sm font-medium text-[#182133] mb-2 truncate">
            {commit.message?.split("\n")[0]}
          </p>
          <span className="font-mono text-[10px] text-[#9aa3b2] bg-[#f1f4f8] border border-[#e4e9f1] px-2 py-0.5 rounded">
            {commit.sha?.slice(0, 7)}
          </span>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={loadDiff}
              disabled={loadingDiff}
              className="flex items-center gap-1.5 text-[10px] text-[#687386] hover:text-[#182133] transition-colors font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loadingDiff ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDiff className="w-3 h-3" />}
              {diff ? "Refresh diff" : "Read diff"}
            </button>
            <button
              onClick={loadSummary}
              disabled={loadingSummary}
              className="flex items-center gap-1.5 text-[10px] text-[#687386] hover:text-[#182133] transition-colors font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loadingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {summary ? "Refresh summary" : "AI summary"}
            </button>
          </div>
          {diff && (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap bg-[#f6f8fb] border border-[#e4e9f1] rounded-lg p-3 text-[11px] leading-relaxed text-[#3c4257] font-mono">
              {diff}
            </pre>
          )}
          {summary && (
            <div className="mt-3">
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 text-[10px] text-[#687386] hover:text-[#182133] transition-colors font-mono uppercase tracking-wider cursor-pointer"
              >
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                AI Summary
              </button>
              {open && (
                <div className="mt-2 text-sm text-[#3c4257] bg-[#f6f8fb] border border-[#e4e9f1] rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Meeting card ──────────────────────────────────────────── */
function MeetingCard({ meeting }) {
  const statusIcon = {
    processing: <Loader2 className="w-3.5 h-3.5 animate-spin text-[#737373]" />,
    done: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />,
  }[meeting.status] || <Clock className="w-3.5 h-3.5 text-[#737373]" />;

  const [open, setOpen] = useState(false);
  return (
    <div className="p-5 border-b border-[#e4e9f1] last:border-0 hover:bg-[#f1f4f8] transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <Mic className="w-4 h-4 text-[#737373] shrink-0" />
        <p className="text-sm font-medium text-[#182133] flex-1 truncate">{meeting.fileName || "Recording"}</p>
        <div className="flex items-center gap-1.5 text-xs text-[#687386]">
          {statusIcon}
          <span className="capitalize">{meeting.status}</span>
        </div>
      </div>
      <p className="text-[10px] text-[#9aa3b2] mb-3">{timeAgo(meeting.createdAt)}</p>

      {meeting.status === "done" && meeting.summary && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-[10px] text-[#737373] hover:text-white transition-colors font-mono uppercase tracking-wider cursor-pointer"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            AI Summary & Issues
          </button>
          {open && (
            <div className="mt-2 text-sm text-[#a3a3a3] bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
              {meeting.summary}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */
export default function ProjectInsights({ repo, onArchiveChanged, initialTab = "commits" }) {
  const [tab, setTab] = useState(initialTab);

  /* commits */
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);

  /* meetings */
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [uploadingMeeting, setUploadingMeeting] = useState(false);

  /* team / invite */
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [members, setMembers] = useState([]);

  /* archive */
  const [archiving, setArchiving] = useState(false);

  /* ── data loaders ─────────────────────────────────────────── */
  const loadCommits = useCallback(async () => {
    setLoadingCommits(true);
    try {
      const res = await api.get(`/repo/${repo._id}/commits`);
      setCommits(res.data.data || []);
    } catch {
      toast.error("Could not load commits");
    } finally {
      setLoadingCommits(false);
    }
  }, [repo]);

  const loadMeetings = useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const res = await api.get(`/meeting/${repo._id}`);
      setMeetings(res.data.data || []);
    } catch {
      // No meetings yet
    } finally {
      setLoadingMeetings(false);
    }
  }, [repo]);

  const loadMembers = useCallback(async () => {
    try {
      const res = await api.get(`/repo/${repo._id}/members`);
      setMembers(res.data.data || []);
    } catch {
      setMembers(repo.collaborators || []);
    }
  }, [repo]);

  useEffect(() => {
    if (!repo) return;
    queueMicrotask(() => {
      if (tab === "commits" && repo.status === "ready") loadCommits();
      if (tab === "meetings") loadMeetings();
      if (tab === "team") loadMembers();
    });
  }, [tab, repo, loadCommits, loadMeetings, loadMembers]);

  /* ── handlers ─────────────────────────────────────────────── */
  const handleUploadMeeting = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMeeting(true);
    const fd = new FormData();
    fd.append("recording", file);
    try {
      await api.post(`/meeting/${repo._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Meeting uploaded — transcription started!");
      loadMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingMeeting(false);
      e.target.value = null;
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post("/invitations", { repoId: repo._id, email: inviteEmail.trim() });
      setMembers((current) => [...current, { email: inviteEmail.trim().toLowerCase(), role: "viewer" }]);
      toast.success("Invitation sent!");
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this project? It will be hidden from your dashboard.")) return;
    setArchiving(true);
    try {
      const res = await api.patch(`/repo/${repo._id}/archive`);
      toast.success("Project archived");
      if (onArchiveChanged) onArchiveChanged(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not archive");
    } finally {
      setArchiving(false);
    }
  };

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col bg-[#f6f8fb]">

      {/* Header */}
      <div className="border-b border-[#e4e9f1] px-6 pt-5 pb-0 shrink-0 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#182133] leading-tight">Project Intelligence</h2>
            <p className="text-xs text-[#9aa3b2] mt-0.5">{repo.owner}/{repo.name}</p>
          </div>
          <a
            href={repo.githubUrl}
            target="_blank" rel="noreferrer"
            className="text-[#9aa3b2] hover:text-[#182133] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-[#687386] hover:text-[#182133]"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── COMMITS tab ───────────────────────────────────── */}
        {tab === "commits" && (
          <div>
            {repo.status !== "ready" && (
              <div className="flex items-center gap-2 m-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Repository is still linking — commits will appear when ready
              </div>
            )}

            {loadingCommits ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#9aa3b2]" />
              </div>
            ) : commits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-[#f1f4f8] border border-[#e4e9f1] flex items-center justify-center">
                  <GitCommit className="w-6 h-6 text-[#9aa3b2]" />
                </div>
                <p className="text-sm text-[#687386]">No commits loaded yet.</p>
                {repo.status === "ready" && (
                  <button
                    onClick={loadCommits}
                    className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Load commits
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {commits.map(c => (
                  <CommitCard key={c.sha} commit={c} repoId={repo._id} repoUrl={repo.githubUrl} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEETINGS tab ──────────────────────────────────── */}
        {tab === "meetings" && (
          <div>
            {/* Upload area */}
            <div className="m-5 bg-white border border-[#e4e9f1] rounded-xl p-6 flex flex-col items-center text-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#f1f4f8] border border-[#e4e9f1] flex items-center justify-center">
                <MonitorPlay className="w-6 h-6 text-[#687386]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#182133] mb-1">Analyze a Meeting</h3>
                <p className="text-xs text-[#687386] max-w-xs">
                  Upload an audio or video recording to identify key issues and summarize the discussion.
                </p>
              </div>
              <label className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${uploadingMeeting ? "bg-[#f1f4f8] text-[#9aa3b2]" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {uploadingMeeting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload Recording</>
                )}
                <input
                  type="file" accept="audio/*,video/*" className="hidden"
                  onChange={handleUploadMeeting} disabled={uploadingMeeting}
                />
              </label>
            </div>

            {/* Past meetings list */}
            {loadingMeetings ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[#333]" />
              </div>
            ) : meetings.length === 0 ? (
              <p className="text-center text-xs text-[#9aa3b2] py-8">No meetings uploaded yet.</p>
            ) : (
              <div className="mx-5 bg-white border border-[#e4e9f1] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[#e4e9f1]">
                  <p className="text-xs font-mono text-[#687386] uppercase tracking-wider">Past Meetings</p>
                </div>
                {meetings.map((m, i) => <MeetingCard key={m._id || i} meeting={m} />)}
              </div>
            )}
          </div>
        )}

        {/* ── TEAM tab ──────────────────────────────────────── */}
        {tab === "team" && (
          <div className="p-5 space-y-4">
            <div className="bg-white border border-[#e4e9f1] rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#e4e9f1] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#182133]">Team Members</h3>
                  <p className="text-xs text-[#687386] mt-0.5">People with access to this repository</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
              </div>

              {members.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="w-8 h-8 text-[#c4cdd9] mx-auto mb-3" />
                  <p className="text-sm text-[#687386]">No team members yet.</p>
                  <p className="text-xs text-[#9aa3b2] mt-1">Invite collaborators to share this project.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e4e9f1]">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-full bg-[#edf4ff] border border-[#d4e2f5] flex items-center justify-center text-xs text-blue-600 font-medium">
                        {m.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#182133] truncate">{m.email}</p>
                        <p className="text-xs text-[#687386] capitalize">{m.role || "viewer"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ARCHIVE tab ───────────────────────────────────── */}
        {tab === "archive" && (
          <div className="p-5 space-y-4">
            {repo.status === "archived" ? (
              <div className="bg-white border border-[#e4e9f1] rounded-xl p-6 text-center space-y-3 shadow-sm">
                <Archive className="w-10 h-10 text-[#9aa3b2] mx-auto" />
                <h3 className="text-xl font-semibold text-[#182133]">Project Archived</h3>
                <p className="text-sm text-[#687386]">This project is archived and hidden from your main dashboard.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#e4e9f1] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#e4e9f1]">
                  <h3 className="text-xl font-semibold text-[#182133]">Archive Project</h3>
                  <p className="text-sm text-[#687386] mt-1">
                    Archiving will hide this project from your dashboard. The data and embeddings will be preserved.
                  </p>
                </div>
                <div className="p-5 bg-[#ef4444]/5">
                  <div className="flex items-start gap-3 mb-5">
                    <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
                    <div className="text-sm text-[#687386]">
                      <p className="font-medium text-[#ef4444] mb-1">Before you archive</p>
                      <ul className="space-y-1 text-xs">
                        <li>· Your teammates will lose access to this project</li>
                        <li>· All commit summaries and meeting transcriptions will be preserved</li>
                        <li>· You can restore it from the archived projects section</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="flex items-center gap-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                    Archive Project
                  </button>
                </div>
              </div>
            )}

            {/* Delete zone */}
            <div className="bg-white border border-[#e4e9f1] rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#e4e9f1]">
                <h3 className="text-sm font-medium text-[#ef4444]">Danger Zone</h3>
              </div>
              <div className="p-5">
                <p className="text-xs text-[#687386] mb-4">
                  Permanently delete this project, all embedded code chunks, and all meeting data. This action cannot be undone.
                </p>
                <button className="flex items-center gap-2 border border-[#ef4444]/30 text-[#ef4444] text-sm px-4 py-2 rounded-lg hover:bg-[#ef4444]/10 transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete project permanently
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Invite modal ─────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !inviting && setShowInviteModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl border border-[#e4e9f1] p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-[#182133]">Invite Member</h2>
                <p className="text-xs text-[#687386] mt-0.5">They'll get access to this repository.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg hover:bg-[#f1f4f8] text-[#9aa3b2] hover:text-[#182133] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#687386] uppercase tracking-widest">Email address</label>
                <input
                  type="email" required autoFocus
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-[#f6f8fb] border border-[#e4e9f1] rounded-xl px-4 py-3 text-sm text-[#182133] placeholder:text-[#9aa3b2] focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4e9f1] text-sm text-[#687386] hover:text-[#182133] hover:border-[#c4cdd9] transition-colors"
                >Cancel</button>
                <button
                  type="submit" disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Send Invite</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
