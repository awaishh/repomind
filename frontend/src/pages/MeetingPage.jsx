import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    Mic,
    MonitorPlay,
    Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useRepoStore } from "@/store";
import AppSidebar from "@/components/AppSidebar";

function MeetingResult({ meeting }) {
    const [showTranscript, setShowTranscript] = useState(false);
    const processing = meeting.status === "processing";
    const failed = meeting.status === "error";

    return (
        <article className="rounded-2xl border border-[#e4e9f1] bg-white p-7 shadow-[0_8px_28px_rgba(24,33,51,0.05)]">
            <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${failed ? "bg-red-50 text-red-500" : "bg-[#edf4ff] text-blue-600"}`}>
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : failed ? <AlertCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#182133]">{meeting.heading || meeting.fileName || "Meeting analysis"}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${processing ? "bg-amber-50 text-amber-700" : failed ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{meeting.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#8a94a5]">{meeting.fileName} · {new Date(meeting.createdAt).toLocaleString()}</p>

                    {processing && <p className="mt-5 text-sm text-[#687386]">Your recording is being processed. This card will update when analysis is complete.</p>}
                    {failed && <p className="mt-5 text-sm text-red-500">{meeting.summary || "Meeting analysis failed."}</p>}
                    {!processing && !failed && (
                        <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                            <section className="rounded-xl border border-[#f0e7c8] bg-[#fffaf0] p-5">
                                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#687386]"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Issues & topics</p>
                                {meeting.issues?.length ? <ul className="space-y-2 text-sm text-[#3d485b]">{meeting.issues.map((issue, index) => <li key={`${issue}-${index}`} className="flex gap-2"><span className="text-amber-500">•</span>{issue}</li>)}</ul> : <p className="text-sm text-[#8a94a5]">No issues were detected.</p>}
                            </section>
                            <section className="rounded-xl border border-[#e7edf5] bg-[#f8fafc] p-5">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#687386]">Summary</p>
                                <p className="whitespace-pre-wrap text-sm leading-7 text-[#3d485b]">{meeting.summary || "No summary returned."}</p>
                            </section>
                        </div>
                    )}
                    {!processing && meeting.transcript && (
                        <button onClick={() => setShowTranscript((open) => !open)} className="mt-5 flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700">
                            {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {showTranscript ? "Hide transcript" : "View transcript"}
                        </button>
                    )}
                    {showTranscript && <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-[#e7eaf0] bg-white p-4 text-xs leading-relaxed text-[#687386]">{meeting.transcript}</pre>}
                </div>
            </div>
        </article>
    );
}

export default function MeetingPage({ theme, setTheme }) {
    const navigate = useNavigate();
    const { repos, fetchRepos } = useRepoStore();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const loadMeetings = async () => {
        try {
            const response = await api.get("/meeting");
            setMeetings(response.data.data || []);
        } catch {
            toast.error("Could not load meetings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { queueMicrotask(() => { loadMeetings(); fetchRepos(); }); }, [fetchRepos]);
    useEffect(() => {
        if (!meetings.some((meeting) => meeting.status === "processing")) return undefined;
        const timer = setInterval(loadMeetings, 4000);
        return () => clearInterval(timer);
    }, [meetings]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const form = new FormData();
        form.append("recording", file);
        try {
            const response = await api.post("/meeting", form, { headers: { "Content-Type": "multipart/form-data" } });
            setMeetings((current) => [response.data.data, ...current]);
            toast.success("Meeting uploaded. Analysis started.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="app-page min-h-screen bg-[#f6f8fb] font-sans text-[#182133]">
            <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#e7eaf0] bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[1440px] items-center px-6"><span className="brand-wordmark text-[#182133]">RepoMind</span></div>
            </header>
            <div className="mx-auto flex max-w-[1440px] pt-16">
                <AppSidebar active="meetings" repos={repos} navigate={navigate} />
                <main className="min-w-0 flex-1 px-6 py-10 md:ml-64 lg:px-12">
                    <div className="mb-9"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Meeting Room</p><h1 className="font-sketch text-5xl tracking-tight text-[#182133]">Understand every conversation</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#687386]">Turn a recording into a clear meeting brief with a heading, issues, summary, and searchable transcript.</p></div>
                    <div className="mb-9 grid max-w-sm rounded-xl border border-[#e4e9f1] bg-white p-7 text-center shadow-[0_8px_24px_rgba(24,33,51,0.06)]">
                        <MonitorPlay className="mx-auto mb-4 h-10 w-10 text-[#182133]" strokeWidth={1.8} />
                        <h2 className="text-base font-semibold text-[#182133]">Create a new meeting</h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#8a94a5]">Analyze your meeting recording and get a clear summary.</p>
                        <label className="mx-auto mt-5 flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? "Uploading…" : "Upload Meeting"}
                            <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                    <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#182133]">Recent analyses</h2><span className="text-xs text-[#8a94a5]">{meetings.length} recording{meetings.length === 1 ? "" : "s"}</span></div>
                    <section className="space-y-4">{loading ? <div className="flex justify-center rounded-2xl bg-white py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9aa3b2]" /></div> : meetings.length ? meetings.map((meeting) => <MeetingResult key={meeting._id} meeting={meeting} />) : <div className="rounded-2xl border border-dashed border-[#d8e0eb] bg-white px-6 py-16 text-center"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f4f8] text-[#aebbd0]"><Mic className="h-6 w-6" /></span><h2 className="text-base font-semibold text-[#182133]">No meeting analyses yet</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#8a94a5]">Your uploaded meeting summaries will appear here.</p></div>}</section>
                </main>
            </div>
        </div>
    );
}
